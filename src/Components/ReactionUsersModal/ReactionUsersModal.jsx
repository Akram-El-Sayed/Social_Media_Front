import React, { useEffect, useState } from 'react'
import { api } from '../../utils/api';
import { typeToEmoji } from '../../utils/TypeToEmoji/TypeToEmoji';
import { FiX, FiUser } from "react-icons/fi";
import { Spinner } from "react-bootstrap";


export default function ReactionUsersModal({ messageId, type, onClose }) {
     const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const emoji = typeToEmoji[type] ?? type;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get(
          `/api/messages/${messageId}/reactions?type=${type}&limit=20`
        );
        if (!cancelled) setUsers(data.users);
      } catch (err) {
        console.error("getReactionUsers error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [messageId, type]);

  return (
    <div
      className="reaction-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="reaction-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reaction-modal__header">
          <span className="reaction-modal__title">{emoji}&nbsp;Reactions</span>
          <button className="reaction-modal__close" onClick={onClose} aria-label="Close">
            <FiX size={16} />
          </button>
        </div>

        <div className="reaction-modal__body">
          {loading ? (
            <div className="text-center py-3"><Spinner size="sm" /></div>
          ) : users.length === 0 ? (
            <p className="reaction-modal__empty">No reactions yet</p>
          ) : (
            users.map((u) => (
              <div key={u._id} className="reaction-modal__user">
                {u.profilePicture ? (
                  <img
                    src={u.profilePicture}
                    alt={u.username}
                    width={34}
                    height={34}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      border: "2px solid #4dffbe",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <FiUser size={14} />
                  </div>
                )}
                <span className="reaction-modal__username">{u.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

