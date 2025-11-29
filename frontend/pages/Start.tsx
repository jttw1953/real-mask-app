import React  from "react";
import { useNavigate } from "react-router-dom";
import PageBackground from "../components/PageBackground";
import s from "./Start.module.css";

export default function Start() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <PageBackground bg="#1D283A" showBlobs>
      <main className={s.content}>
        <h1 className={s.title}>Welcome to Real Mask!</h1>
        <h2 className={s.subtitle}>Connect Instantly</h2>
        <button className={s.cta} onClick={handleGetStarted}>
          Get Started
        </button>
      </main>
    </PageBackground>
  );
}
