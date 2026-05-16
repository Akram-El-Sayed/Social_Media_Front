import React, { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PiEyeClosedDuotone } from "react-icons/pi";
import { LiaEyeSolid } from "react-icons/lia";
import { api } from "../../utils/api";
import toast, { Toaster } from "react-hot-toast";
import { MdEmail } from "react-icons/md";

export default function Register({ theme }) {
  const [name, setname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpass, setConfirmpass] = useState("");
  const [email, setEmail] = useState("");
  const [isPassword, setIsPassword] = useState(true);
  const [isConfirmPassword, setIsConfirmPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmpass) {
      setError("Passwords do not match");
      return;
    }

    const load = toast.loading("Creating account...");

    try {
      setIsLoading(true);

      await api.post("/api/auth/register", {
        username: name,
        password,
        email,
      });
      toast.success("Registration successful! Check your email.", { id: load });

      navigate("/Verify-Otp", { state: { email: email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed", {
        id: load,
      });
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className=" vh-100 d-flex  justify-content-center  align-items-center  ">
      <Toaster position="bottom-right"></Toaster>
      <div
        className={` w-75 border ${
          theme === "light" ? "shadow" : "shadow-dark"
        } p-3 rounded-4  d-flex flex-column justify-content-center `}
      >
        <h3 className=" text-center font4 text-warning mt-4">Sign Up</h3>

        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="username">Username</Form.Label>
            <Form.Control
              type="text"
              id="username"
              name="username"
              placeholder="Type your username."
              value={name}
              onChange={(e) => setname(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="email"><MdEmail />Email</Form.Label>
            <Form.Control
              type="email"
              id="email"
              name="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="password">Password</Form.Label>

            <InputGroup>
              <Form.Control
                type={isPassword ? "password" : "text"}
                id="password"
                name="password"
                placeholder="Type your password."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <InputGroup.Text
                className=" cursor-pointer"
                onClick={() => setIsPassword((prev) => !prev)}
              >
                {isPassword ? <LiaEyeSolid /> : <PiEyeClosedDuotone />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="confirmpass">Confirm Password</Form.Label>

            <InputGroup>
              <Form.Control
                type={isConfirmPassword ? "password" : "text"}
                id="confirmpass"
                name="confirmpass"
                placeholder="Type your password again."
                value={confirmpass}
                onChange={(e) => setConfirmpass(e.target.value)}
                required
              />

              <InputGroup.Text
                className=" cursor-pointer"
                onClick={() => setIsConfirmPassword((prev) => !prev)}
              >
                {isConfirmPassword ? <LiaEyeSolid /> : <PiEyeClosedDuotone />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>
          {error && <p className="text-danger text-center">{error}</p>}

          <Button
            type="submit"
            variant={isLoading ? "secondary" : "primary"}
            disabled={isLoading}
            className="w-75 d-block rounded-4 mt-4  mx-auto"
          >
            {isLoading ? "Loading..." : "Sign Up"}
          </Button>
          <p className=" text-center mt-2">
            have an account?{" "}
            <Link className=" text-warning" to={"/login"}>
              Sign In
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
}
