import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  FiArrowLeft,
  FiImage,
  FiX,
  FiGlobe,
  FiUsers,
  FiLock,
  FiSend,
  FiHash,
} from "react-icons/fi";
import { api } from "../../utils/api";

const PRIVACY_OPTIONS = [
  { value: "public",       label: "Public",       icon: <FiGlobe size={14} /> },
  { value: "friends-only", label: "Friends Only", icon: <FiUsers size={14} /> },
  { value: "private",      label: "Private",      icon: <FiLock  size={14} /> },
];

export default function CreatePost() {
  const navigate = useNavigate();

  const [content,   setContent]   = useState("");
  const [privacy,   setPrivacy]   = useState("public");
  const [hashInput, setHashInput] = useState("");
  const [hashtags,  setHashtags]  = useState([]);
  const [files,     setFiles]     = useState([]);   // { file, preview }
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);   // string
  const [errors,    setErrors]    = useState([]);     // string[] from server validation

  const fileInputRef = useRef(null);

  /* ── Hashtag helpers (Updated for Mobile) ── */
  const addHashtag = (raw) => {
    // Cleans the tag: removes #, spaces, and commas
    const tag = raw.replace(/[#,\s]/g, "").toLowerCase().trim();
    if (tag && !hashtags.includes(tag)) {
      setHashtags((h) => [...h, tag]);
    }
  };

  const handleHashChange = (e) => {
    const val = e.target.value;
    if (val.endsWith(" ") || val.endsWith(",")) {
      addHashtag(val);
      setHashInput("");
    } else {
      setHashInput(val);
    }
  };

  const onHashKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHashtag(hashInput);
      setHashInput("");
    }
  };

  const removeHashtag = (tag) =>
    setHashtags((h) => h.filter((t) => t !== tag));

  /* Media helpers */
  const onFileChange = (e) => {
    const picked = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video"),
    }));
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = "";
  };

  const removeFile = (idx) =>
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      setError("Add some text or media before posting.");
      return;
    }

    setLoading(true);
    setError(null);
    setErrors([]);

    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      fd.append("privacy", privacy);
      fd.append("hashtags", hashtags.join(","));
      files.forEach(({ file }) => fd.append("media", file));

      const { data } = await api.post("/api/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/post/${data._id}`);
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors?.length) {
        setErrors(resData.errors);
      } else {
        setError(resData?.message || "Failed to create post.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container className="cp-root py-4" style={{ maxWidth: 580 }}>

        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <Button
            variant="outline-secondary"
            size="sm"
            className="rounded-circle p-1 lh-1"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FiArrowLeft size={18} />
          </Button>
          <h5 className="mb-0 fw-semibold">New Post</h5>
        </div>

        {(error || errors.length > 0) && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => { setError(null); setErrors([]); }}
            className="mb-3"
          >
            {error && <p className="mb-0">{error}</p>}
            {errors.length > 0 && (
              <ul className="mb-0 ps-3 mt-1">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">

          {/* Content */}
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="cp-textarea"
            />
          </Form.Group>

          {/* Media previews */}
          {files.length > 0 && (
            <div className="cp-media-grid">
              {files.map(({ preview, isVideo }, idx) => (
                <div key={idx} className="cp-thumb-wrap">
                  {isVideo ? (
                    <video src={preview} className="cp-thumb" muted />
                  ) : (
                    <img src={preview} alt="" className="cp-thumb" />
                  )}
                  <button
                    type="button"
                    className="cp-remove-btn"
                    onClick={() => removeFile(idx)}
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hashtag input (Updated for Mobile) */}
          <Form.Group>
            <div className="cp-hash-input-wrap d-flex align-items-center">
              <FiHash size={15} className="text-muted flex-shrink-0" />
              <Form.Control
                type="text"
                placeholder="Add hashtag (Space or Enter)"
                value={hashInput}
                onChange={handleHashChange}
                onKeyDown={onHashKeyDown}
                className="border-0 shadow-none p-0 bg-transparent ms-2"
              />
              {hashInput.trim() && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-primary text-decoration-none fw-bold ms-2"
                  onClick={() => { addHashtag(hashInput); setHashInput(""); }}
                >
                  Add
                </Button>
              )}
            </div>
            {hashtags.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    bg="secondary"
                    className="cp-tag d-flex align-items-center gap-1 fw-normal"
                  >
                    #{tag}
                    <FiX
                      size={11}
                      style={{ cursor: "pointer" }}
                      onClick={() => removeHashtag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </Form.Group>

          {/* Footer: privacy + actions */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-pill d-flex align-items-center gap-1"
                onClick={() => fileInputRef.current.click()}
                type="button"
              >
                <FiImage size={15} /> Media
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={onFileChange}
              />

              <Form.Select
                size="sm"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="cp-privacy-select rounded-pill"
              >
                {PRIVACY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Form.Select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-pill px-4 d-flex align-items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <><FiSend size={14} /> Post</>
              )}
            </Button>
          </div>

        </Form>
      </Container>
    </>
  );
}