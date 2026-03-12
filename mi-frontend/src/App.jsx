import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./Login";
import MyCourses from "./MyCourses";
import CourseDetail from "./CourseDetail";
import CreateReport from "./CreateReport";
import TemplateBuilder from "./TemplateBuilder";
import GeneratingReport from "./GeneratingReport";
import GeneratedReport from "./GeneratedReport";
import ReportView from "./ReportView";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cursos/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crear-informe"
            element={
              <ProtectedRoute>
                <CreateReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crear-plantilla"
            element={
              <ProtectedRoute>
                <TemplateBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/informe/:reportId"
            element={
              <ProtectedRoute>
                <ReportView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generating-report"
            element={
              <ProtectedRoute>
                <GeneratingReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generated-report"
            element={
              <ProtectedRoute>
                <GeneratedReport />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
