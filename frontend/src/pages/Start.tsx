import { useNavigate } from "react-router-dom";

export default function Start() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#1D283A] flex flex-col items-center justify-center text-center overflow-hidden">
      {/* soft background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <main className="relative px-6">
        <h1 className="text-6xl md:text-7xl font-extrabold text-blue-500 drop-shadow-md">
          Welcome to Real Mask!
        </h1>
        <h2 className="mt-6 text-4xl md:text-5xl font-bold text-blue-400">
          Connect Instantly
        </h2>

        <button
          onClick={() => navigate("/login")}
          className="mt-12 rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-400 transition"
        >
          Get Started
        </button>
      </main>
    </div>
  );
}
