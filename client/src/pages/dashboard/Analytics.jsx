import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import ProjectSwitcher from "../../components/layout/ProjectSwitcher";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, PageSpinner } from "../../components/ui/Feedback";
import { useProjectContext } from "../../context/ProjectContext";
import { analyticsApi } from "../../api/workflows";
import NoProjectState from "../../components/projects/NoProjectState";
const STAT_CARDS = [
  { key: "totalRequests", label: "Total Requests" },
  { key: "successfulRequests", label: "Successful" },
  { key: "failedRequests", label: "Failed" },
  { key: "successRate", label: "Success Rate", suffix: "%" },
  { key: "avgResponseTimeMs", label: "Avg Response Time", suffix: "ms" },
];
export default function Analytics() {
  const { activeProjectId } = useProjectContext();
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!activeProjectId) return;
    setData(null);
    analyticsApi
      .get({ project: activeProjectId, days: 14 })
      .then((res) => setData(res.data))
      .catch((error) => {
        console.error("Analytics error:", error);
      });
  }, [activeProjectId]);
  if (!activeProjectId) {
    return (
      <>
        {" "}
        <Topbar title="Analytics" projectSwitcher={<ProjectSwitcher />} />{" "}
        <NoProjectState />{" "}
      </>
    );
  }
  if (!data) return <PageSpinner />;
  const hasData = data.summary.totalRequests > 0;
  return (
    <>
      {" "}
      <Topbar title="Analytics" projectSwitcher={<ProjectSwitcher />} />{" "}
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {" "}
        {!hasData ? (
          <Card>
            {" "}
            <CardBody>
              {" "}
              <EmptyState
                icon={BarChart3}
                title="No activity yet"
                description="Execute some API requests or workflows in this project, and their analytics will show up here."
              />{" "}
            </CardBody>{" "}
          </Card>
        ) : (
          <>
            {" "}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {" "}
              {STAT_CARDS.map((s) => (
                <Card key={s.key} className="p-4">
                  {" "}
                  <p className="text-xs font-medium text-ink-secondary">
                    {" "}
                    {s.label}{" "}
                  </p>{" "}
                  <p className="mt-2 font-display text-2xl font-semibold text-ink">
                    {" "}
                    {data.summary[s.key]} {s.suffix || ""}{" "}
                  </p>{" "}
                </Card>
              ))}{" "}
            </div>{" "}
            <Card>
              {" "}
              <CardHeader
                title="Requests over time"
                subtitle="Last 14 days"
              />{" "}
              <CardBody>
                {" "}
                <ResponsiveContainer width="100%" height={260}>
                  {" "}
                  <LineChart data={data.requestsOverTime}>
                    {" "}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1DDE4"
                    />{" "}
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />{" "}
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />{" "}
                    <Tooltip />{" "}
                    <Line
                      type="monotone"
                      dataKey="successful"
                      stroke="#16A34A"
                      strokeWidth={2}
                      name="Successful"
                      dot={false}
                    />{" "}
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#DC2626"
                      strokeWidth={2}
                      name="Failed"
                      dot={false}
                    />{" "}
                    <Legend />{" "}
                  </LineChart>{" "}
                </ResponsiveContainer>{" "}
              </CardBody>{" "}
            </Card>{" "}
            <div className="grid lg:grid-cols-2 gap-6">
              {" "}
              <Card>
                {" "}
                <CardHeader title="Most-used endpoints" />{" "}
                <CardBody>
                  {" "}
                  {data.topEndpoints.length ? (
                    <ul className="divide-y divide-line text-sm">
                      {" "}
                      {data.topEndpoints.map((e, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between py-2"
                        >
                          {" "}
                          <span className="truncate flex-1 font-mono text-xs">
                            {" "}
                            <span className="font-semibold text-primary mr-1">
                              {" "}
                              {e.method}{" "}
                            </span>{" "}
                            {e.url}{" "}
                          </span>{" "}
                          <span className="text-ink-secondary text-xs shrink-0 ml-2">
                            {" "}
                            {e.count}× · {e.avgDurationMs}ms{" "}
                          </span>{" "}
                        </li>
                      ))}{" "}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-secondary">
                      {" "}
                      No requests yet.{" "}
                    </p>
                  )}{" "}
                </CardBody>{" "}
              </Card>{" "}
              <Card>
                {" "}
                <CardHeader title="Workflow executions" />{" "}
                <CardBody>
                  {" "}
                  <ResponsiveContainer width="100%" height={200}>
                    {" "}
                    <BarChart
                      data={[
                        {
                          name: "Succeeded",
                          value: data.workflowExecutions.succeeded,
                          fill: "#16A34A",
                        },
                        {
                          name: "Failed",
                          value: data.workflowExecutions.failed,
                          fill: "#DC2626",
                        },
                        {
                          name: "Stopped",
                          value: data.workflowExecutions.stopped,
                          fill: "#D97706",
                        },
                      ]}
                    >
                      {" "}
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#F1DDE4"
                      />{" "}
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />{" "}
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />{" "}
                      <Tooltip />{" "}
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} />{" "}
                    </BarChart>{" "}
                  </ResponsiveContainer>{" "}
                </CardBody>{" "}
              </Card>{" "}
            </div>{" "}
          </>
        )}{" "}
      </div>{" "}
    </>
  );
}
