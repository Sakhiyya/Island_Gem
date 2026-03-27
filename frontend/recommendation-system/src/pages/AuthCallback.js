import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import OAuthProfileModal from "./OAuthProfileModal";

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error  = params.get("error");

    if (error) {
      navigate(`/tourist-login?error=${error}`);
      return;
    }

    const id = params.get("id");
    if (!id) {
      navigate("/tourist-login?error=oauth");
      return;
    }

    const userData = {
      id,
      email:       params.get("email"),
      username:    params.get("username") || params.get("email"),
      first_name:  params.get("first_name"),
      last_name:   params.get("last_name"),
      nationality: params.get("nationality"),
      avatar_url:  params.get("avatar_url"),
      role:        "tourist",
    };

    login(userData);

    // Show profile completion modal if nationality is missing
    if (!userData.nationality) {
      setPendingUser(userData);
    } else {
      navigate("/");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (pendingUser) {
    return (
      <OAuthProfileModal
        user={pendingUser}
        onComplete={() => navigate("/")}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #008080, #00b4d8)",
      color: "#fff",
      fontSize: "1.1rem",
      fontFamily: "Segoe UI, sans-serif",
    }}>
      Signing you in…
    </div>
  );
}

export default AuthCallback;
