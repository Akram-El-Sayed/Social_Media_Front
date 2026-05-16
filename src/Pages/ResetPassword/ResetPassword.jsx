import React, { useState } from "react";
import { Form, Button, InputGroup, Card } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import toast, { Toaster } from "react-hot-toast";
import { PiEyeClosedDuotone } from "react-icons/pi";
import { LiaEyeSolid } from "react-icons/lia";

export default function ResetPassword({ theme }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isPassword, setIsPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPass) {
      return toast.error("Passwords do not match");
    }

    const load = toast.loading("Updating password...");
    setIsLoading(true);
    try {
      // Backend expects: { email, otp, password }
      await api.post("/api/auth/reset-password", {
        email,
        otp,
        password: newPassword,
      });

      toast.success("Password updated! Please login.", { id: load });
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP or Expired", {
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
        <h3 className="text-center font4 text-warning">New Password</h3>
        <p className="text-center text-muted small">Code sent to: {email}</p>

        <Form onSubmit={handleReset}>
          <Form.Group className="mb-3">
            <Form.Label>OTP Code</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={isPassword ? "password" : "text"}
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <InputGroup.Text
                className="cursor-pointer"
                onClick={() => setIsPassword(!isPassword)}
              >
                {isPassword ? <LiaEyeSolid /> : <PiEyeClosedDuotone />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Repeat new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 rounded-4 mt-3"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
