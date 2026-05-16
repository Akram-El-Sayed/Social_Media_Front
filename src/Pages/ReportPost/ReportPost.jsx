import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Form, Button, Spinner, Alert } from "react-bootstrap";
import { FiArrowLeft, FiFlag } from "react-icons/fi";
import { api } from "../../utils/api";

const REPORT_TYPES = [
  { value: "spam",        label: "Spam" },
  { value: "harassment",  label: "Harassment or Bullying" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "nudity",      label: "Nudity or Sexual Content" },
  { value: "violence",    label: "Violence or Dangerous Content" },
  { value: "other",       label: "Other" },
];

export default function ReportPost() {
  const { postId } = useParams();
  const navigate   = useNavigate();

  const [post, setPost]       = useState(null);
  const [type, setType]       = useState(REPORT_TYPES[0].value);
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch the post so we have reportedUserId
  useEffect(() => {
    api.get(`/api/posts/${postId}`)
      .then(({ data }) => setPost(data))
      .catch(() => setError("Post not found."))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Please describe the issue."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/reports", {
        postId,
        reportedUserId: post?.user?._id ?? post?.user,
        type,
        reason: reason.trim(),
      });
      setSuccess(true);
    } catch (err) {
      const resData = err.response?.data;
      setError(resData?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 520 }}>
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
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <FiFlag size={18} className="text-danger" /> Report Post
        </h5>
      </div>

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="secondary" />
        </div>
      )}

      {!loading && success && (
        <Alert variant="success">
          <Alert.Heading>Report submitted</Alert.Heading>
          <p className="mb-3">Thanks for letting us know. We'll review this post.</p>
          <Button variant="outline-success" size="sm" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </Alert>
      )}

      {!loading && !success && (
        <>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            {/* Report type */}
            <Form.Group>
              <Form.Label className="fw-medium small">What's the issue?</Form.Label>
              {REPORT_TYPES.map(({ value, label }) => (
                <Form.Check
                  key={value}
                  type="radio"
                  id={`type-${value}`}
                  name="reportType"
                  label={label}
                  value={value}
                  checked={type === value}
                  onChange={(e) => setType(e.target.value)}
                />
              ))}
            </Form.Group>

            {/* Reason */}
            <Form.Group>
              <Form.Label className="fw-medium small">Additional details</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Describe the issue…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                className="rounded-3"
              />
              <Form.Text className="text-muted">{reason.length}/500</Form.Text>
            </Form.Group>

            <Button
              type="submit"
              variant="danger"
              className="rounded-pill px-4 align-self-end"
              disabled={submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" /> : "Submit Report"}
            </Button>
          </Form>
        </>
      )}
    </Container>
  );
}
