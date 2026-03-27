import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const user = {
      id: params.get("id"),
      email: params.get("email"),
      username: params.get("username"),
      first_name: params.get("first_name"),
      last_name: params.get("last_name"),
      avatar_url: params.get("avatar_url"),
      nationality: params.get("nationality"),
    };

    localStorage.setItem("user", JSON.stringify(user));

    navigate("/tourist-dashboard");
  }, [navigate]);

  return <p>Signing you in...</p>;
}

export default AuthCallback;