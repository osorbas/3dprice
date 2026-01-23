import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard/farm"); // Redireciona para a Print Farm por predefinição
  }, [navigate]);

  return null;
};

export default Index;