import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-12 bg-white rounded-lg shadow-lg min-w-[400px]">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Benvingut</h1>
        <div className="flex flex-col gap-4">
          <button
            className="px-8 py-3 text-lg font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            onClick={() => navigate("/login")}
          >
            Iniciar Sessió
          </button>
          <button
            className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            onClick={() => navigate("/cursos")}
          >
            Els Meus Cursos
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
