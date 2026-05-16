import React, { useEffect, useState } from 'react';
import { useDispatch } from "react-redux";
import { api } from '../../utils/api'; 
import { Button, Form, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { FiSend } from "react-icons/fi";
import { updatePost } from "../../Store/feedSlice/feedSlice";

export default function ShareToMessageModal({ postId, onClose, currentUser }) {
  const dispatch = useDispatch();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/messages/conversations");
        setConversations(data.conversations);
      } catch (err) {
        console.error("fetchConversations error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const getOtherUser = (conv) => {
    const meId = currentUser?._id?.toString();
    if (!meId) return conv.participants?.[0];
    return (
      conv.participants?.find((p) => p._id?.toString() !== meId) ??
      conv.participants?.[0]
    );
  };

  const handleSend = async () => {
    if (!selectedId || sending) return;

    const conv = conversations.find((c) => c._id === selectedId);
    const other = getOtherUser(conv);
    if (!other) return;

    setSending(true);
    try {
      const { data } = await api.post(`/api/posts/${postId}/share`, {
        receiverId: other._id,
        text: text.trim(),
      });
      
      // Dispatch update to Redux so the PostCard updates immediately
      if (data.sharesCount !== undefined) {
  dispatch(updatePost({ postId, sharesCount: data.sharesCount }));
}
      
      setSent(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error("sharePost error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1rem" }}>Share to conversation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {sent ? (
          <p className="text-center text-success mb-0">✓ Shared!</p>
        ) : loading ? (
          <div className="text-center"><Spinner size="sm" /></div>
        ) : conversations.length === 0 ? (
          <p className="text-muted small text-center">No conversations yet.</p>
        ) : (
          <>
            <ListGroup style={{ maxHeight: 220, overflowY: "auto" }} className="mb-2">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                return (
                  <ListGroup.Item
                    key={conv._id}
                    action
                    active={selectedId === conv._id}
                    onClick={() => setSelectedId(conv._id)}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <img
                      src={other?.profilePicture || "/default-avatar.png"}
                      alt={other?.username}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <span style={{ fontSize: ".88rem" }}>{other?.username}</span>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
            <Form.Control
              size="sm"
              placeholder="Add a message (optional)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </>
        )}
      </Modal.Body>
      {!sent && (
        <Modal.Footer className="py-2">
          <Button
            size="sm"
            variant="primary"
            disabled={!selectedId || sending}
            onClick={handleSend}
            className="d-flex align-items-center gap-1"
          >
            {sending ? <Spinner size="sm" /> : <FiSend size={13} />} Send
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}