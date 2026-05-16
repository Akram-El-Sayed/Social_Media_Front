import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Container, Card, Button, Spinner, Alert, Form, Badge } from "react-bootstrap";
import { FiRefreshCw, FiAlertTriangle, FiUser, FiImage, FiVideo } from "react-icons/fi";
import { api } from "../../utils/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "resolved", label: "Resolved" },
];

const ACTION_OPTIONS = [
  { value: "none", label: "No Action" },
  { value: "delete_post", label: "Delete Post" },
  { value: "warn_user", label: "Warn User" },
  { value: "suspend_user", label: "Suspend User" },
];

const statusVariant = (status) => {
  if (status === "pending") return "warning";
  if (status === "under_review") return "info";
  if (status === "resolved") return "success";
  return "secondary";
};

const actionLabel = (action) => {
  const found = ACTION_OPTIONS.find((a) => a.value === action);
  return found?.label || action || "—";
};

const formatDate = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "—";
  }
};

const getPostMediaPreview = (post) => {
  const first = post?.media?.[0];
  if (!first?.url) return null;
  const isVideo =
    first?.type?.includes("video") || /\.(mp4|webm|ogg|mov)$/i.test(first.url);
  return { url: first.url, isVideo };
};

export default function AdminReport() {
  const [status, setStatus] = useState("pending");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [takingId, setTakingId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [actionByReport, setActionByReport] = useState({});

  const fetchReports = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const { data } = await api.get(`/api/reports?status=${encodeURIComponent(status)}`);
      setReports(data.reports || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === "pending").length,
    [reports],
  );

  const handleTake = async (reportId) => {
    setTakingId(reportId);
    setError(null);
    try {
      const { data } = await api.patch(`/api/reports/${reportId}/take`);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? data : r)),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to take report.");
    } finally {
      setTakingId(null);
    }
  };

  const handleResolve = async (reportId) => {
    const action = actionByReport[reportId] || "none";
    setResolvingId(reportId);
    setError(null);
    try {
      const { data } = await api.patch(`/api/reports/${reportId}/resolve`, {
        action,
      });
      const updated = data.report;
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? updated : r)),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve report.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 1200 }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1 d-flex align-items-center gap-2">
            <FiAlertTriangle className="text-danger" />
            Admin Reports
          </h3>
          <div className="text-muted">
            {pendingCount} pending report{pendingCount === 1 ? "" : "s"} in the current view
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Form.Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: 180 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>

          <Button
            variant="outline-secondary"
            onClick={fetchReports}
            disabled={refreshing}
            className="d-flex align-items-center gap-2"
          >
            {refreshing ? <Spinner size="sm" /> : <FiRefreshCw />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="shadow-sm border-0 rounded-4">
          <Card.Body className="text-center py-5 text-muted">
            No reports found for this status.
          </Card.Body>
        </Card>
      ) : (
        <div className="d-grid gap-3">
          {reports.map((report) => {
            const postPreview = getPostMediaPreview(report.post);
            const currentAction = actionByReport[report._id] || report.actionTaken || "none";

            return (
              <Card key={report._id} className="shadow-sm border-0 rounded-4">
                <Card.Body>
                  <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <Badge bg={statusVariant(report.status)} className="rounded-pill">
                          {report.status}
                        </Badge>
                        <Badge bg="dark" className="rounded-pill">
                          {report.type}
                        </Badge>
                        <span className="text-muted small">
                          Submitted {formatDate(report.createdAt)}
                        </span>
                      </div>

                      <div className="d-flex flex-wrap gap-3 text-muted small">
                        <span>
                          <strong>Reporter:</strong>{" "}
                          {report.reporter?.username || "Unknown"}
                        </span>
                        <span>
                          <strong>Reported user:</strong>{" "}
                          {report.reportedUser?.username || "Unknown"}
                        </span>
                        <span>
                          <strong>Reviewed by:</strong>{" "}
                          {report.reviewedBy?.username || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex flex-column align-items-start gap-2">
                      <div className="text-muted small">
                        Action: <strong>{actionLabel(report.actionTaken)}</strong>
                      </div>

                      {report.status === "pending" && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleTake(report._id)}
                          disabled={takingId === report._id}
                        >
                          {takingId === report._id ? <Spinner size="sm" /> : "Take for Review"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-lg-7">
                      <div className="p-3 border rounded-4 h-100">
                        <h6 className="mb-2">Reason</h6>
                        <p className="mb-0 text-break">{report.reason || "—"}</p>

                        {report.description && (
                          <>
                            <hr />
                            <h6 className="mb-2">Description</h6>
                            <p className="mb-0 text-break">{report.description}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-lg-5">
                      <div className="p-3 border rounded-4 h-100">
                        <h6 className="mb-3">Reported Post</h6>

                        {report.post ? (
                          <>
                            <div className="mb-3">
                              {postPreview ? (
                                postPreview.isVideo ? (
                                  <div className="position-relative">
                                    <video
                                      src={postPreview.url}
                                      muted
                                      preload="metadata"
                                      style={{
                                        width: "100%",
                                        maxHeight: 220,
                                        objectFit: "cover",
                                        borderRadius: 12,
                                      }}
                                    />
                                    <div className="position-absolute top-50 start-50 translate-middle text-white">
                                      <FiVideo size={28} />
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={postPreview.url}
                                    alt="post preview"
                                    style={{
                                      width: "100%",
                                      maxHeight: 220,
                                      objectFit: "cover",
                                      borderRadius: 12,
                                    }}
                                  />
                                )
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded-4"
                                  style={{ height: 180 }}
                                >
                                  <FiImage size={28} className="text-muted" />
                                </div>
                              )}
                            </div>

                            <div className="small text-muted mb-2">
                              <strong>Post content:</strong>{" "}
                              {report.post.content || "—"}
                            </div>
                          </>
                        ) : (
                          <div className="text-muted small">Post not available.</div>
                        )}

                        <div className="small text-muted">
                          <strong>Reported user status:</strong>{" "}
                          {report.reportedUser?.accountStatus || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="d-flex flex-wrap align-items-end justify-content-between gap-3">
                    <div style={{ minWidth: 240 }}>
                      <Form.Label className="small mb-1">Resolve action</Form.Label>
                      <Form.Select
                        size="sm"
                        value={currentAction}
                        onChange={(e) =>
                          setActionByReport((prev) => ({
                            ...prev,
                            [report._id]: e.target.value,
                          }))
                        }
                        disabled={report.status !== "under_review"}
                      >
                        {ACTION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Form.Select>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={fetchReports}
                      >
                        Reload
                      </Button>

                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleResolve(report._id)}
                        disabled={
                          report.status !== "under_review" ||
                          resolvingId === report._id
                        }
                      >
                        {resolvingId === report._id ? (
                          <Spinner size="sm" />
                        ) : (
                          "Resolve"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}