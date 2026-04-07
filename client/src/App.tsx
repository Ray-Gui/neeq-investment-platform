import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import NEEQCompanies from "./pages/NEEQCompanies";
import FinancialAnalysis from "./pages/FinancialAnalysis";
import ScoringSystem from "./pages/ScoringSystem";
import CompanyScoring from "./pages/CompanyScoring";
import ListingPotential from "./pages/ListingPotential";
import DealerOpportunities from "./pages/DealerOpportunities";
import InvestmentDecision from "./pages/InvestmentDecision";
import CompanyDetail from "./pages/CompanyDetail";
import BSEListingTracker from "./pages/BSEListingTracker";
import TrendRating from "./pages/TrendRating";
import LiquidityScore from "./pages/LiquidityScore";
import IndustryBenchmark from "./pages/IndustryBenchmark";
import InventoryRisk from "./pages/InventoryRisk";
import SpreadAnalysis from "./pages/SpreadAnalysis";
import ComplianceLibrary from "./pages/ComplianceLibrary";
import FairValueModel from "./pages/FairValueModel";
import PasswordProtect from "./pages/PasswordProtect";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/bse"} component={Home} />
      <Route path={"/neeq"} component={NEEQCompanies} />
      <Route path={"/financial"} component={FinancialAnalysis} />
      <Route path={"/scoring"} component={ScoringSystem} />
      <Route path={"/company-scoring"} component={CompanyScoring} />
      <Route path={"/listing-potential"} component={ListingPotential} />
      <Route path={"/dealer-opportunities"} component={DealerOpportunities} />
      <Route path={"/investment-decision"} component={InvestmentDecision} />
      <Route path={"/company/:code"} component={CompanyDetail} />
      <Route path={"/bse-listing-tracker"} component={BSEListingTracker} />
      <Route path={"/trend-rating"} component={TrendRating} />
      <Route path={"/liquidity-score"} component={LiquidityScore} />
      <Route path={"/industry-benchmark"} component={IndustryBenchmark} />
      <Route path={"/inventory-risk"} component={InventoryRisk} />
      <Route path={"/spread-analysis"} component={SpreadAnalysis} />
      <Route path={"/compliance"} component={ComplianceLibrary} />
      <Route path={"/fair-value"} component={FairValueModel} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查是否已解锁
    const unlocked = localStorage.getItem("app_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <PasswordProtect
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
