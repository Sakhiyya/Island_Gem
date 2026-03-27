import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ExploreMap from "./pages/ExploreMap";
import Itinerary from "./pages/Itinerary";
import DestinationDetails from "./pages/DestinationDetails";
import TouristDashboard from "./pages/TouristDashboard";
import Footer from "./components/Footer";
import TouristLogin from "./pages/TouristLogin";
import TouristRegister from "./pages/TouristRegister";
import LoginSelection from "./pages/LoginSelection";
import AdminLogin from "./pages/AdminLogin";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import SavedItineraries from "./pages/SavedItineraries";
import AspectReviews from "./pages/AspectReviews";
import AuthCallback from "./pages/AuthCallback";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHealth from "./pages/admin/AdminHealth";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminStakeholders from "./pages/admin/AdminStakeholders";
import Partners from "./pages/Partners";
import StakeholderRegister from "./pages/StakeholderRegister";
import StakeholderLogin from "./pages/StakeholderLogin";
import StakeholderDashboard from "./pages/StakeholderDashboard";
import AuthorityLogin from "./pages/AuthorityLogin";
import AuthorityDashboard from "./pages/AuthorityDashboard";

// Layout wrapper that adds the footer for all tourist-facing pages
function TouristShell() {
  return (
    <div className="container-fluid p-0 d-flex flex-column min-vh-100">
      <div className="flex-grow-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* ── Admin panel — isolated, no header/footer ── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index                  element={<AdminHealth />} />
          <Route path="users"           element={<AdminUsers />} />
          <Route path="stakeholders"    element={<AdminStakeholders />} />
          <Route path="logs"            element={<AdminLogs />} />
        </Route>

        {/* ── Stakeholder — isolated, no tourist header/footer ── */}
        <Route path="/stakeholder-login"     element={<StakeholderLogin />} />
        <Route path="/stakeholder-dashboard" element={<StakeholderDashboard />} />

        {/* ── Tourism Authority — isolated ── */}
        <Route path="/authority-login"     element={<AuthorityLogin />} />
        <Route path="/authority-dashboard" element={<AuthorityDashboard />} />

        {/* ── Tourist-facing site with footer ── */}
        <Route element={<TouristShell />}>
          <Route path="/"                              element={<Home />} />
          <Route path="/login-selection"               element={<LoginSelection />} />
          <Route path="/explore"                       element={<Explore />} />
          <Route path="/explore/map"                   element={<ExploreMap />} />
          <Route path="/explore/:id"                   element={<DestinationDetails />} />
          <Route path="/explore/:id/aspect/:aspect"    element={<AspectReviews />} />
          <Route path="/plan-trip"                     element={<Itinerary />} />
          <Route path="/tourist-dashboard"             element={<TouristDashboard />} />
          <Route path="/tourist-login"                 element={<TouristLogin />} />
          <Route path="/tourist-register"              element={<TouristRegister />} />
          <Route path="/admin-login"                   element={<AdminLogin />} />
          <Route path="/support"                       element={<Support />} />
          <Route path="/contact"                       element={<Contact />} />
          <Route path="/my-itineraries"                element={<SavedItineraries />} />
          <Route path="/auth/callback"                 element={<AuthCallback />} />
          <Route path="/partners"                      element={<Partners />} />
          <Route path="/stakeholder-register"          element={<StakeholderRegister />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
