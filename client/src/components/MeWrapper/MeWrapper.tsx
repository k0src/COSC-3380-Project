import { memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";

const MeWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.id) {
      navigate(`/users/${user.id}`);
    }
  }, [isAuthenticated, user, navigate]);

  return null;
};

export default memo(MeWrapper);
