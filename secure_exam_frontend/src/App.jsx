import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth, isAdmin } from "./auth";
import Layout from "./components";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentExams from "./pages/StudentExams";
import TakeExam from "./pages/TakeExam";
import Results from "./pages/Results";
import Subjects from "./pages/Subjects";
import Questions from "./pages/Questions";
import Exams from "./pages/Exams";
import PaperUpload from "./pages/PaperUpload";

function Guard({ admin, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !isAdmin(user)) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  return isAdmin(user) ? <Navigate to="/admin/exams" replace /> : <StudentExams />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Exam-taking screen is full-bleed: no navigation to wander off to mid-exam */}
      <Route path="/attempt/:examId" element={<Guard><TakeExam /></Guard>} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Home />} />
        <Route path="results" element={<Results />} />
        <Route path="admin/exams" element={<Guard admin><Exams /></Guard>} />
        <Route path="admin/questions" element={<Guard admin><Questions /></Guard>} />
        <Route path="admin/subjects" element={<Guard admin><Subjects /></Guard>} />
        <Route path="admin/papers" element={<Guard admin><PaperUpload /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
