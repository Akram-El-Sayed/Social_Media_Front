import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Spinner, Row, Col } from "react-bootstrap";
import { IoArrowBack, IoCloudUploadOutline, IoCloseCircle } from "react-icons/io5";
import { api } from "../../utils/api"; 
import { toast } from "react-hot-toast"; 

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form States
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [hashtags, setHashtags] = useState("");
  const [currentMedia, setCurrentMedia] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Post Data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/api/posts/${id}`);
        const post = data.post;
        setContent(post.content || "");
        setPrivacy(post.privacy || "public");
        setHashtags(post.hashtags?.join(", ") || "");
        setCurrentMedia(post.media || []);
      } catch (err) {
        toast.error("Failed to load post", err);
        // navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  // Handle File Selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(files);
  };

  // Handle Submit
 const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  const formData = new FormData();
  formData.append("content", content);
  formData.append("privacy", privacy);
  
  // Clean the hashtags thoroughly
  const tagsArray = hashtags
    .split(",")
    .map(tag => tag.trim().replace(/^#/, "")) 
    .filter(tag => tag.length > 0);

  if (tagsArray.length > 0) {
    tagsArray.forEach(tag => formData.append("hashtags[]", tag));
  } else {
    formData.append("hashtags[]", ""); 
  }

  // 3. Add files
  newFiles.forEach((file) => {
    formData.append("media", file); 
  });

  try {
    await api.put(`/api/posts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Post updated!");
    navigate(`/post/${id}`);
  } catch (err) {
    console.error("Update error:", err);
    // Log specifically to see the Joi validation error
    if (err.response?.data) {
      console.log("Backend error details:", err.response.data);
    }
    const msg = err.response?.data?.message || "Update failed";
    toast.error(Array.isArray(msg) ? msg[0] : msg);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: "700px" }}>
      <Button variant="" onClick={() => navigate(-1)} className="text-decoration-none  p-0 mb-3">
        <IoArrowBack size={24} /> <span className="ms-1">Back</span>
      </Button>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <h4 className="fw-bold mb-4">Edit Post</h4>

          <Form onSubmit={handleSubmit}>
            {/* Content Input */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Caption</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className=" border-2 shadow-none"
              />
            </Form.Group>

            {/* Privacy & Hashtags Row */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Privacy</Form.Label>
                  <Form.Select 
                    value={privacy} 
                    onChange={(e) => setPrivacy(e.target.value)}
                    className=" border-2 shadow-none"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="followers">Followers Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Hashtags (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="tag1, tag2"
                    className=" border-2 shadow-none"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Media Section */}
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold">Media</Form.Label>
              
              {/* Preview Current Media */}
              {currentMedia.length > 0 && newFiles.length === 0 && (
                <div className="d-flex gap-2 overflow-auto mb-2 py-2">
                  {currentMedia.map((m, i) => (
                    <div key={i} className="position-relative" style={{ width: "80px", height: "80px" }}>
                      <img 
                        src={m.thumbnail || m.url} 
                        className="rounded object-fit-cover w-100 h-100 border" 
                        alt="current" 
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New Input */}
              <div 
                className="border-2 border-dashed rounded p-4 text-center "
                style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <IoCloudUploadOutline size={30} className="text-secondary mb-2" />
                <p className="small text-secondary mb-0">
                  {newFiles.length > 0 
                    ? `${newFiles.length} new files selected` 
                    : "Click to replace media (Videos/Images)"}
                </p>
                <input 
                  id="fileInput"
                  type="file" 
                  multiple 
                  hidden 
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
              </div>
              {newFiles.length > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-danger mt-1 p-0" 
                  onClick={() => setNewFiles([])}
                >
                  <IoCloseCircle /> Cancel replacement
                </Button>
              )}
              <Form.Text className="text-muted">
                Note: Uploading new files will replace all existing media for this post.
              </Form.Text>
            </Form.Group>

            <div className="d-grid">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={submitting}
                className="py-2 fw-bold"
              >
                {submitting ? <Spinner animation="border" size="sm" /> : "Save Changes"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}