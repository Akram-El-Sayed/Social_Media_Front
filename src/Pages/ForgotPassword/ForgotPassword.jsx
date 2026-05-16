import React, { useState } from "react";
import { Form, Button, Container, Card } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../utils/api";
import toast, { Toaster } from "react-hot-toast";
import { MdEmail } from "react-icons/md";

export default function ForgotPassword({ theme }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    const load = toast.loading("Checking user...");
    setIsLoading(true);
    try {
      // Updated path to /api/auth prefix to match your register page
      await api.post("/api/auth/forgot-password", { email });
      toast.success("OTP sent to email", { id: load });

      // Send user to reset page and pass email in state
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found", {
        id: load,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center">
      <Toaster position="bottom-right"></Toaster>
      <Card
        className={`w-75 border ${theme === "light" ? "shadow" : "shadow-dark"} p-4 rounded-4`}
       
      >
        <h3 className="text-center font4 text-warning mt-2">Forgot Password</h3>
        <p className="text-center text-muted small">
          Enter your email to receive a reset code
        </p>

        <Form onSubmit={handleForgot}>
          <Form.Group className="mb-3">
            <Form.Label>
              <MdEmail /> Email Address
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 rounded-4 mt-3"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Code"}
          </Button>

          <div className="text-center mt-3">
            <Link to="/login" className="text-decoration-none text-warning">
              Back to Login
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
