import React, { useState } from "react";
import { Form, Button, Container, Card } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../../utils/api";

export default function VerifyOtp({ theme }) {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email) {
      toast.error("Email is missing. Please register again.");
      return;
    }
    setIsSubmitting(true);
    const load = toast.loading("Verifying code...");
    try {
      await api.post("/api/auth/verify-otp", { email, otp });
      toast.success("Account verified successfully!", { id: load });
      navigate("/login");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.messages?.[0] ||
        "Invalid OTP";
      toast.error(errorMsg, { id: load });
    } finally{
        setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/api/auth/resend-otp", { email });
      toast.success("A new code has been sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Wait before resending");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Toaster position="bottom-right"></Toaster>
      <Card
        className={`w-75 border ${theme === "light" ? "shadow" : "shadow-dark"} p-4 rounded-4`}
      >
        <h4 className="text-center font4 text-warning">Verify Your Account</h4>
        <p className="text-center text-muted small">
          Enter the code sent to {email}
        </p>
        <Form onSubmit={handleVerify}>
          <Form.Control
            type="text"
            placeholder="6-digit OTP"
            className="mb-3 text-center"
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button
            variant="primary"
            className="w-100 rounded-4 mt-3"
            type="submit"
          >
            Verify
          </Button>
          <div className=" d-flex justify-content-center">
            <Button
              variant="link"
              className="text-warning"
              onClick={handleResend}
            >
              Resend Code
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}
