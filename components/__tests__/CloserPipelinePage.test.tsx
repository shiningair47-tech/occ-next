import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CloserPipelinePage from "../CloserPipelinePage";

const mockLeads: any[] = [
  { id: "lead-1", name: "Alice Johnson", phone: "(555) 123-4567", source: "Facebook", notes: "", team: "Alpha", setter: "Bob Setter", closer: "Carol Closer", setter_status: "qualified", closer_status: "hot", handoff_status: "accepted", handoff_note: "", handoff_at: "2025-06-01T10:00:00", handoff_by: "", accepted_at: "2025-06-01T11:00:00", whatsapp_added: true, t1: true, t2: false, t3: false, t4: false, t5: false, t6: false, appointment_date: "", assigned_date: "2025-06-01", created_at: "2025-05-30", called_dates: [], followups: [{ id: "f1", scheduled_date: "2025-06-28", scheduled_time: "10:00", type: "confirmation", status: "pending", completed_at: null, completed_by: null }], qualified_at: null, batch_id: null, assigned_at: null },
  { id: "lead-2", name: "Bob Smith", phone: "(555) 987-6543", source: "Google", notes: "", team: "Alpha", setter: "Bob Setter", closer: "Carol Closer", setter_status: "qualified", closer_status: "cold", handoff_status: "accepted", handoff_note: "", handoff_at: "2025-06-02T10:00:00", handoff_by: "", accepted_at: "2025-06-02T11:00:00", whatsapp_added: false, t1: false, t2: false, t3: false, t4: false, t5: false, t6: false, appointment_date: "", assigned_date: "2025-06-02", created_at: "2025-05-31", called_dates: [], followups: [], qualified_at: null, batch_id: null, assigned_at: null },
  { id: "lead-3", name: "Charlie Brown", phone: "(555) 555-1212", source: "Facebook", notes: "", team: "Alpha", setter: "Bob Setter", closer: "", setter_status: "appointment_fixed", closer_status: "", handoff_status: "pending", handoff_note: "Likes the product, needs a call", handoff_at: "2025-06-28T09:00:00", handoff_by: "Bob Setter", accepted_at: "", whatsapp_added: false, t1: false, t2: false, t3: false, t4: false, t5: false, t6: false, appointment_date: "", assigned_date: "", created_at: "2025-06-28", called_dates: [], followups: [], qualified_at: null, batch_id: null, assigned_at: null },
  { id: "lead-4", name: "Diana Prince", phone: "(555) 777-8888", source: "Instagram", notes: "", team: "Alpha", setter: "Bob Setter", closer: "Carol Closer", setter_status: "qualified", closer_status: "arrived", handoff_status: "accepted", handoff_note: "", handoff_at: "2025-06-01T10:00:00", handoff_by: "", accepted_at: "2025-06-01T11:00:00", whatsapp_added: true, t1: true, t2: true, t3: true, t4: true, t5: true, t6: true, appointment_date: "2025-06-28", assigned_date: "2025-06-01", created_at: "2025-05-30", called_dates: [], followups: [{ id: "f2", scheduled_date: "2025-06-25", scheduled_time: "14:00", type: "confirmation", status: "done", completed_at: "2025-06-25T14:30:00", completed_by: "Carol Closer" }], qualified_at: null, batch_id: null, assigned_at: null },
  { id: "lead-5", name: "Eve Adams", phone: "(555) 333-2222", source: "Referral", notes: "", team: "Alpha", setter: "Bob Setter", closer: "Carol Closer", setter_status: "qualified", closer_status: "lost", handoff_status: "accepted", handoff_note: "", handoff_at: "2025-06-01T10:00:00", handoff_by: "", accepted_at: "2025-06-01T11:00:00", whatsapp_added: false, t1: false, t2: false, t3: false, t4: false, t5: false, t6: false, appointment_date: "", assigned_date: "2025-06-01", created_at: "2025-05-30", called_dates: [], followups: [], qualified_at: null, batch_id: null, assigned_at: null },
];

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() }, toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.spyOn(global, "fetch").mockImplementation(async (url) => {
    if (typeof url === "string" && url.includes("/api/leads?scope=closer_pipeline")) {
      return { ok: true, json: async () => ({ leads: mockLeads, batches: [] }) } as Response;
    }
    return { ok: true, json: async () => ({}) } as Response;
  });
});

describe("CloserPipelinePage", () => {
  it("renders leads after loading", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
  });

  it("renders KPI count for active pipeline leads", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("4")).toBeTruthy(); });
  });

  it("shows intake section for pending handoff leads", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Charlie Brown")).toBeTruthy(); });
  });

  it("renders all pipeline leads", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
    expect(screen.getByText("Bob Smith")).toBeTruthy();
    expect(screen.getByText("Diana Prince")).toBeTruthy();
    expect(screen.getByText("Eve Adams")).toBeTruthy();
  });

  it("filters by Hot status", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
    fireEvent.click(screen.getAllByText("Hot")[0]);
    await waitFor(() => { expect(screen.queryByText("Bob Smith")).toBeNull(); });
    expect(screen.getByText("Alice Johnson")).toBeTruthy();
  });

  it("searches by name", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
    const input = screen.getByPlaceholderText(/Search by name/);
    fireEvent.change(input, { target: { value: "Diana" } });
    await waitFor(() => { expect(screen.queryByText("Alice Johnson")).toBeNull(); });
    expect(screen.getByText("Diana Prince")).toBeTruthy();
  });

  it("searches by phone", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
    fireEvent.change(screen.getByPlaceholderText(/Search by name/), { target: { value: "777-8888" } });
    await waitFor(() => { expect(screen.queryByText("Alice Johnson")).toBeNull(); });
    expect(screen.getByText("Diana Prince")).toBeTruthy();
  });

  it("searches by source", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
    fireEvent.change(screen.getByPlaceholderText(/Search by name/), { target: { value: "Instagram" } });
    await waitFor(() => { expect(screen.queryByText("Alice Johnson")).toBeNull(); });
    expect(screen.getByText("Diana Prince")).toBeTruthy();
  });

  it("shows empty state for unmatched search", async () => {
    render(<CloserPipelinePage userName="Carol Closer" userTeam="Alpha" />);
    await waitFor(() => { expect(screen.getByText("Alice Johnson")).toBeTruthy(); });
    fireEvent.change(screen.getByPlaceholderText(/Search by name/), { target: { value: "ZzzzNonexistent" } });
    await waitFor(() => { expect(screen.getByText("No leads in this stage yet")).toBeTruthy(); });
  });
});
