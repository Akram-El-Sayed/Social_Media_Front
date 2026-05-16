import { Container, Spinner } from "react-bootstrap";

export const Loading = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Spinner variant="primary"></Spinner>
    </Container>
  );
};
