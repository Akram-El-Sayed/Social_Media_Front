import { Button } from "react-bootstrap";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { clearUser } from "../../Store/UserSlice/UserSlice";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { RiLogoutCircleLine } from "react-icons/ri";


export const LogoutButton = ({ onClick }) => {
  const go = useNavigate()
  // dispatch
  const dispatch = useDispatch();

 async function handleLogout() {
    onClick?.();
    await api.post('/api/auth/logout');
    // Clear Info Redux
    dispatch(clearUser());
   
    // Clear Info LocalStorage
    localStorage.removeItem("user");
   localStorage.removeItem("token");
    go("/login")
    // Message
    toast.success("User Logout Successfully!");
  }

  return (
    <Button variant="outline-danger" className='button-logout py-2 fs-2 border-0 rounded-4'  onClick={handleLogout}>
       <RiLogoutCircleLine />
    </Button>
  );
};
