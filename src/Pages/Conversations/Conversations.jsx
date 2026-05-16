import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useSocket } from "../../Hooks/useSocket";
import ConversationList from "../../Components/ConversationList/ConversationList";
import MessagePanel from "../../Components/MessagePanel/MessagePanel";
import { useSelector } from "react-redux";

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [showPanel, setShowPanel]         = useState(false);
  const { socket, isConnected }           = useSocket();
  const location                          = useLocation();
  const navigate                          = useNavigate();
  const processedId                       = useRef(null);
  const { userInfo }                      = useSelector((state) => state.user);
  const currentUser                       = userInfo;

  
  const activeConvIdRef = useRef(null);
  useEffect(() => {
    activeConvIdRef.current = activeConv?._id?.toString() ?? null;
  }, [activeConv?._id]);

  const handleSelect = useCallback((conv) => {
    setActiveConv(conv);
    setShowPanel(true);
    setConversations((prev) =>
      prev.map((conversation) => (conversation._id === conv._id ? { ...conversation, unreadCount: 0 } : conversation))
    );
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/messages/conversations");
        setConversations(data.conversations);
      } catch (err) {
        console.error("getConversations error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Handle navigate("/Conversations", { state: { startWith } })
  useEffect(() => {
    const startUser = location.state?.startWith;
    if (loading || !startUser) return;
    if (processedId.current === startUser._id) return;
    processedId.current = startUser._id;

    navigate(location.pathname, { replace: true, state: {} });

    const existing = conversations.find((conv) =>
      conv.participants.some(
        (participant) => participant._id?.toString() === startUser._id?.toString()
      )
    );

    if (existing) {
      handleSelect(existing);
    } else {
      setActiveConv({
        _id:          null,
        participants: [currentUser, startUser],
        lastMessage:  null,
        unreadCount:  0,
        isGhost:      true,
      });
      setShowPanel(true);
    }
  }, [
    loading,
    conversations,
    currentUser,
    handleSelect,
    navigate,
    location.pathname,
    location.state?.startWith,
  ]);

  // Socket: keep sidebar in sync
  useEffect(() => {
    if (!socket || !isConnected) return;

    const onNewMessage = (msg) => {
      const convId = (msg.conversation?._id ?? msg.conversation)?.toString();

      setConversations((prev) => {
        const exists = prev.some((c) => c._id?.toString() === convId);

      
        if (!exists) {
          const stub = {
            _id: convId,
            participants: [
              currentUser,
              msg.sender?._id
                ? { _id: msg.sender._id, username: msg.sender.username, profilePicture: msg.sender.profilePicture }
                : { _id: convId },
            ],
            lastMessage: msg,
            updatedAt: new Date().toISOString(),
            unreadCount: 1,
          };
          return [stub, ...prev];
        }

      
        const updated = prev.map((conversation) => {
          if (conversation._id?.toString() !== convId) return conversation;
          const isOpen = activeConvIdRef.current === convId;
          return {
            ...conversation,
            lastMessage: msg,
            updatedAt:   new Date().toISOString(),
            unreadCount: isOpen ? 0 : (conversation.unreadCount || 0) + 1,
          };
        });

        return [...updated].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    socket.on("message:new", onNewMessage);
    return () => socket.off("message:new", onNewMessage);
    
  }, [socket, isConnected, currentUser]);

  const handleBack = () => {
    setShowPanel(false);
    setActiveConv(null);
  };

  const handleGhostResolved = useCallback((realConv) => {
    setActiveConv(realConv);
    setConversations((prev) => {
      const exists = prev.some((conversation) => conversation._id === realConv._id);
      const updated = exists
        ? prev.map((conversation) => (conversation._id === realConv._id ? realConv : conversation))
        : [realConv, ...prev];
      return updated.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    });
  }, []);

  const handleLastMessage = useCallback((convId, msg) => {
    if (!convId) return;
    setConversations((prev) =>
      [
        ...prev.map((conversation) =>
          conversation._id === convId
            ? { ...conversation, lastMessage: msg, updatedAt: msg.createdAt }
            : conversation
        ),
      ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  }, []);

  return (
    <div className="chat-page">
      <div className={`chat-sidebar${showPanel ? " chat-sidebar--hidden" : ""}`}>
        <ConversationList
          conversations={conversations}
          activeConv={activeConv}
          currentUser={currentUser}
          loading={loading}
          onSelect={handleSelect}
        />
      </div>

      <div className={`chat-main${!showPanel ? " chat-main--hidden" : ""}`}>
        {activeConv ? (
          <MessagePanel
            key={activeConv._id ?? "ghost"}
            conversation={activeConv}
            currentUser={currentUser}
            socket={socket}
            isConnected={isConnected}
            onBack={handleBack}
            onLastMessage={handleLastMessage}
            onGhostResolved={handleGhostResolved}
          />
        ) : (
          <div className="chat-empty">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
