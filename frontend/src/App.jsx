import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "@/pages/login";
import Friends from "@/pages/friends";
import Groups from "@/pages/groups";
import Profile from "@/pages/profile";
import Test from "@/pages/test";
import Explorer from "@/pages/explorer";
import useAuth from "@/hooks/auth/use-auth";
// import Layout from "./layouts/layout";

// eslint-disable-next-line react/prop-types
// function ProtectedRoute({ children }) {
//   const { isAuthenticated } = useAuth();
//   if (!isAuthenticated) return <Navigate to="/login" />;
//   return children;
// }

// eslint-disable-next-line react/prop-types
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          // element={
          //   <ProtectedRoute>
          //     <Layout />
          //   </ProtectedRoute>
          // }
        >
          <Route path="friends" element={<Friends />} />
          <Route path="groups" element={<Groups />} />
          <Route path="profile" element={<Profile />} />
          <Route path="test" element={<Test />} />
          <Route path="explorer" element={<Explorer />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
