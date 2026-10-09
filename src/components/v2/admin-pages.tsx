"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, RotateCcw, Minus, Nfc, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useWorkspace,
  total,
  states,
  campusFor,
  initialWorkspace,
  type Student,
  type CatalogService,
  type Facility,
  type Reader,
} from "@/lib/v2/workspace";
import { money, services, STIPEND } from "@/lib/v2/support";
import { toast } from "sonner";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      {children}
    </label>
  );
}

function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All states</option>
      {states.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}

function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-4 mb-8">
      <div>
        <h1 className="page-heading">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Overview() {
  const { data } = useWorkspace();
  const all = [...data.students, ...(data.student ? [data.student] : [])];
  const monthly = all.reduce((v, s) => v + total(s.subscriptions, data.catalog), 0);

  return (
    <>
      <Heading title="Overview" description="The programme at a glance." />
      <div className="admin-stats">
        {[
          ["Students", all.length],
          ["Monthly committed", money(monthly)],
          [
            "Total to date",
            money(all.reduce((v, s) => v + total(s.subscriptions, data.catalog) * s.monthsEnrolled, 0)),
          ],
          ["Readers online", data.readers.filter((r) => r.online).length + " / " + data.readers.length],
        ].map(([k, v]) => (
          <div className="dashboard-panel" key={k}>
            <p className="text-sm text-muted-foreground">{k}</p>
            <strong className="display text-3xl block mt-3">{v}</strong>
          </div>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-5">Support subscriptions</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Subscribers</th>
                <th>Monthly price</th>
                <th>Monthly worth</th>
              </tr>
            </thead>
            <tbody>
              {data.catalog
                .filter((c) => !c.archived)
                .map((c) => {
                  const subscribersCount = all.filter((s) => s.subscriptions.includes(c.id)).length;
                  return (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{subscribersCount}</td>
                      <td>{money(c.price)}</td>
                      <td>{money(c.price * subscribersCount)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-10">
        <div className="flex justify-between mb-5">
          <h2 className="text-xl font-bold">Students by state</h2>
          <Button asChild variant="outline">
            <Link href="/admin/students">View students</Link>
          </Button>
        </div>
        <div className="admin-stats">
          {[...new Set(all.map((s) => s.state))].map((state) => (
            <div className="dashboard-panel" key={state}>
              <p className="text-sm text-muted-foreground">{state}</p>
              <strong className="text-2xl block mt-2">
                {all.filter((s) => s.state === state).length}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function Students() {
  const { data, update, registerStudentApi } = useWorkspace();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [mode, setMode] = useState("");
  const [edit, setEdit] = useState<Student | null>(null);

  const all = [...data.students, ...(data.student ? [data.student] : [])];
  const shown = all.filter(
    (s) =>
      (!state || s.state === state) &&
      (!mode || s.mode === mode) &&
      `${s.firstName} ${s.lastName} ${s.email} ${s.cardId}`.toLowerCase().includes(search.toLowerCase())
  );

  async function save() {
    if (!edit) return;
    const isNew = !data.students.some((s) => s.id === edit.id) && edit.id !== "local";

    if (isNew) {
      await registerStudentApi({
        firstName: edit.firstName,
        lastName: edit.lastName,
        email: edit.email,
        phone: edit.phone,
        state: edit.state,
        mode: edit.mode,
        subscriptions: edit.subscriptions,
        cardId: edit.cardId,
      });
    } else {
      update((w) =>
        edit.id === "local"
          ? { ...w, student: edit }
          : {
              ...w,
              students: w.students.some((s) => s.id === edit.id)
                ? w.students.map((s) => (s.id === edit.id ? edit : s))
                : [edit, ...w.students],
            }
      );
    }
    setEdit(null);
    toast.success("Student saved");
  }

  return (
    <>
      <Heading
        title="Students"
        description="Manage students, subscriptions and facility assignments."
        action={
          <Button
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                firstName: "",
                lastName: "",
                email: "",
                state: "Kwara",
                campus: "Ilorin Campus",
                mode: "onsite",
                cardId: "L2E-2026-" + Math.floor(1000 + Math.random() * 9000),
                monthsEnrolled: 1,
                monthlyStipend: STIPEND,
                subscriptions: [],
                assignments: {},
                createdAt: new Date().toISOString(),
                activity: [],
              })
            }
          >
            <Plus />
            Add student
          </Button>
        }
      />
      <div className="admin-filters">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10"
            placeholder="Search name, email or card ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <StateSelect value={state} onChange={setState} />
        <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">All modes</option>
          <option value="onsite">Onsite</option>
          <option value="online">Online</option>
        </select>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{shown.length} students</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {["Student", "Card ID", "Campus", "Mode", "Services", "Monthly", "To date", ""].map((v) => (
                <th key={v}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>
                    {s.firstName} {s.lastName}
                  </strong>
                  {s.id === "local" && <span className="status-pill ml-2">This device</span>}
                  <small>{s.email}</small>
                </td>
                <td className="font-mono">{s.cardId}</td>
                <td>
                  {s.campus}
                  <small>{s.state}</small>
                </td>
                <td>
                  <span className="status-pill">{s.mode}</span>
                </td>
                <td>{s.subscriptions.length}</td>
                <td>{money(total(s.subscriptions, data.catalog))}</td>
                <td>{money(total(s.subscriptions, data.catalog) * s.monthsEnrolled)}</td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={"Edit " + s.firstName}
                    onClick={() => setEdit(s)}
                  >
                    <Pencil />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="p-10 text-center text-muted-foreground">No students found.</p>}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{edit?.firstName ? "Manage student" : "Add student"}</DialogTitle>
            <DialogDescription>Student details, subscriptions and access.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["firstName", "lastName", "email", "cardId"] as const).map((k) => (
                <Field
                  key={k}
                  label={
                    { firstName: "First name", lastName: "Last name", email: "Email", cardId: "NFC card ID" }[k]
                  }
                >
                  <Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                </Field>
              ))}
              <Field label="State">
                <StateSelect
                  value={edit.state}
                  onChange={(v) =>
                    setEdit({ ...edit, state: v, campus: edit.mode === "onsite" ? campusFor(v) : "Remote" })
                  }
                />
              </Field>
              <Field label="Mode">
                <select
                  className="form-select"
                  value={edit.mode}
                  onChange={(e) => {
                    const nextMode = e.target.value === "online" ? "online" : "onsite";
                    setEdit({
                      ...edit,
                      mode: nextMode,
                      campus: nextMode === "online" ? "Remote" : campusFor(edit.state),
                    });
                  }}
                >
                  <option>onsite</option>
                  <option>online</option>
                </select>
              </Field>
              <Field label="Months enrolled">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={edit.monthsEnrolled}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      monthsEnrolled: Math.max(1, Math.min(12, Number(e.target.value))),
                    })
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <h3 className="font-semibold mb-3">Subscriptions</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {data.catalog
                    .filter((c) => !c.archived && c.modes.includes(edit.mode))
                    .map((c) => (
                      <label key={c.id} className="flex justify-between gap-3 text-sm">
                        {c.name}
                        <Switch
                          checked={edit.subscriptions.includes(c.id)}
                          onCheckedChange={(v) =>
                            setEdit({
                              ...edit,
                              subscriptions: v
                                ? [...edit.subscriptions, c.id]
                                : edit.subscriptions.filter((id) => id !== c.id),
                            })
                          }
                        />
                      </label>
                    ))}
                </div>
              </div>
              {edit.mode === "onsite" &&
                ["hub", "accommodation", "transport"].map((kind) => (
                  <div key={kind} className="grid gap-3">
                    <Field label={kind[0]?.toUpperCase() + kind.slice(1)}>
                      <select
                        className="form-select"
                        value={edit.assignments[kind] ?? ""}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            assignments: { ...edit.assignments, [kind]: e.target.value },
                          })
                        }
                      >
                        <option value="">Unassigned</option>
                        {data.facilities
                          .filter((f) => f.kind === kind)
                          .map((f) => (
                            <option value={f.id} key={f.id}>
                              {f.name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    {data.facilities.find((f) => f.id === edit.assignments[kind])?.rooms?.length ? (
                      <Field label="Room / Hall">
                        <select
                          className="form-select"
                          value={edit.rooms?.[kind] ?? ""}
                          onChange={(e) =>
                            setEdit({
                              ...edit,
                              rooms: { ...edit.rooms, [kind]: e.target.value },
                            })
                          }
                        >
                          <option value="">All rooms</option>
                          {data.facilities
                            .find((f) => f.id === edit.assignments[kind])
                            ?.rooms?.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                        </select>
                      </Field>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!edit?.firstName || !edit?.lastName || !edit?.email}>
              Save student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Services() {
  const { data, update, saveServicePriceApi, archiveServiceApi } = useWorkspace();
  const [edit, setEdit] = useState<CatalogService | null>(null);
  const [archived, setArchived] = useState(false);
  const [reset, setReset] = useState(false);
  const all = [...data.students, ...(data.student ? [data.student] : [])];

  return (
    <>
      <Heading
        title="Services"
        description="The support menu. Set pricing, availability and card access."
        action={
          <Button
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                description: "",
                price: 0,
                modes: ["onsite", "online"],
                tapAccess: false,
                icon: "wallet",
              })
            }
          >
            <Plus />
            Add service
          </Button>
        }
      />
      <div className="flex justify-between mb-6">
        <label className="flex gap-2 text-sm items-center">
          <Switch checked={archived} onCheckedChange={setArchived} />
          Show archived
        </label>
        <Button variant="outline" onClick={() => setReset(true)}>
          <RotateCcw />
          Reset to defaults
        </Button>
      </div>
      <div className="admin-service-grid">
        {data.catalog
          .filter((c) => archived || !c.archived)
          .map((c) => {
            const Icon = services.find((s) => s.id === c.icon)?.icon ?? Wallet;
            return (
              <article className="dashboard-panel" key={c.id}>
                <div className="flex justify-between gap-3">
                  <span className="service-icon">
                    <Icon />
                  </span>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={"Edit " + c.name}
                      onClick={() => setEdit(c)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={(c.archived ? "Restore " : "Archive ") + c.name}
                      onClick={async () => {
                        await archiveServiceApi(c.id);
                      }}
                    >
                      {c.archived ? <RotateCcw /> : <Trash2 />}
                    </Button>
                  </div>
                </div>
                <h2 className="font-bold text-lg">
                  {c.name}
                  {c.archived && " (archived)"}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 min-h-10">{c.description}</p>
                <div className="flex justify-between items-center mt-5">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={"Decrease " + c.name + " price"}
                    onClick={async () => {
                      const newPrice = Math.max(0, c.price - 5000);
                      await saveServicePriceApi(c.id, c.name, newPrice);
                    }}
                  >
                    <Minus />
                  </Button>
                  <strong className="text-primary text-xl">
                    {money(c.price)}
                    <small className="text-sm text-muted-foreground font-normal"> /mo</small>
                  </strong>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={"Increase " + c.name + " price"}
                    onClick={async () => {
                      const newPrice = c.price + 5000;
                      await saveServicePriceApi(c.id, c.name, newPrice);
                    }}
                  >
                    <Plus />
                  </Button>
                </div>
                <div className="mt-5 border-t pt-4 text-sm space-y-2">
                  <div className="summary-line">
                    <span className="text-muted-foreground">Subscribers</span>
                    <strong>{all.filter((s) => s.subscriptions.includes(c.id)).length}</strong>
                  </div>
                  <div className="summary-line">
                    <span className="text-muted-foreground">Monthly worth</span>
                    <strong>{money(c.price * all.filter((s) => s.subscriptions.includes(c.id)).length)}</strong>
                  </div>
                  <div className="summary-line">
                    <span className="text-muted-foreground">Available to</span>
                    <span>{c.modes.join(" · ")}</span>
                  </div>
                  {c.tapAccess && (
                    <p className="flex gap-1 text-muted-foreground text-xs">
                      <Nfc className="size-3" />
                      NFC tap access
                    </p>
                  )}
                </div>
              </article>
            );
          })}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.name ? "Edit service" : "Add service"}</DialogTitle>
            <DialogDescription>Monthly support service details.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="grid gap-4">
              <Field label="Name">
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </Field>
              <Field label="Tagline">
                <Input
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                />
              </Field>
              <Field label="Monthly price (₦)">
                <Input
                  type="number"
                  min="0"
                  value={edit.price}
                  onChange={(e) => setEdit({ ...edit, price: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
              <Field label="Icon">
                <select
                  className="form-select"
                  value={edit.icon}
                  onChange={(e) => setEdit({ ...edit, icon: e.target.value })}
                >
                  {services.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              {["onsite", "online"].map((m) => (
                <label key={m} className="summary-line text-sm">
                  {m}
                  <Switch
                    checked={edit.modes.includes(m)}
                    onCheckedChange={(v) =>
                      setEdit({
                        ...edit,
                        modes: v ? [...edit.modes, m] : edit.modes.filter((item) => item !== m),
                      })
                    }
                  />
                </label>
              ))}
              <label className="summary-line text-sm">
                NFC tap access
                <Switch
                  checked={edit.tapAccess}
                  onCheckedChange={(v) => setEdit({ ...edit, tapAccess: v })}
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              disabled={!edit?.name}
              onClick={async () => {
                if (!edit) return;
                await saveServicePriceApi(edit.id, edit.name, edit.price);
                setEdit(null);
              }}
            >
              Save service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reset} onOpenChange={setReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset services to defaults?</DialogTitle>
            <DialogDescription>This restores the original support menu and prices.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                update((w) => ({ ...w, catalog: initialWorkspace().catalog }));
                setReset(false);
              }}
            >
              Reset services
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Facilities() {
  const { data, update } = useWorkspace();
  const [kind, setKind] = useState("");
  const [state, setState] = useState("");
  const [edit, setEdit] = useState<Facility | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(20);

  return (
    <>
      <Heading
        title="Facilities"
        description="Learning spaces, accommodation, shuttle routes and kitchens."
        action={
          <Button
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                kind: "hub",
                state: "Kwara",
                campus: "Ilorin Campus",
                capacity: 100,
                rooms: [],
              })
            }
          >
            <Plus />
            Add facility
          </Button>
        }
      />
      <div className="admin-filters">
        <select className="form-select" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All types</option>
          {["hub", "accommodation", "transport", "kitchen"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <StateSelect value={state} onChange={setState} />
      </div>

      <div className="admin-service-grid">
        {data.facilities
          .filter((f) => (!kind || f.kind === kind) && (!state || f.state === state))
          .map((f) => {
            const occupied = [...data.students, ...(data.student ? [data.student] : [])].filter((s) =>
              Object.values(s.assignments).includes(f.id)
            ).length;
            return (
              <article className="dashboard-panel" key={f.id}>
                <div className="flex justify-between">
                  <span className="status-pill">{f.kind}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={"Edit " + f.name}
                    onClick={() => setEdit(f)}
                  >
                    <Pencil />
                  </Button>
                </div>
                <h2 className="font-bold text-lg mt-4">{f.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {f.campus} · {f.state}
                </p>
                <div className="summary-line text-sm mt-6">
                  <span>Capacity</span>
                  <strong>
                    {occupied} / {f.capacity}
                  </strong>
                </div>
                <progress className="facility-progress mt-3" max={f.capacity || 1} value={occupied} />
                <div className="flex justify-between text-xs text-muted-foreground mt-5">
                  <span>{f.rooms?.length ?? 0} rooms / halls</span>
                  <span>{data.readers.filter((r) => r.facilityId === f.id).length} card readers</span>
                </div>
                <Button className="w-full mt-5" variant="outline" onClick={() => setEdit(f)}>
                  Manage facility
                </Button>
              </article>
            );
          })}
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.name || "Add facility"}</DialogTitle>
            <DialogDescription>Facility details, rooms and reader assignments.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </Field>
              <Field label="Kind">
                <select
                  className="form-select"
                  value={edit.kind}
                  onChange={(e) => setEdit({ ...edit, kind: e.target.value })}
                >
                  {["hub", "accommodation", "transport", "kitchen"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="State">
                <StateSelect
                  value={edit.state}
                  onChange={(s) => setEdit({ ...edit, state: s, campus: campusFor(s) })}
                />
              </Field>
              <Field label="Capacity">
                <Input
                  type="number"
                  min="1"
                  value={edit.capacity}
                  onChange={(e) => setEdit({ ...edit, capacity: Math.max(1, Number(e.target.value)) })}
                />
              </Field>
              <div className="sm:col-span-2">
                <h3 className="font-semibold mb-3">Rooms / Halls</h3>
                {edit.rooms?.map((r, i) => (
                  <div key={r.id} className="flex gap-2 mb-2">
                    <Input
                      aria-label="Room name"
                      value={r.name}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          rooms: (edit.rooms ?? []).map((v, j) =>
                            i === j ? { ...v, name: e.target.value } : v
                          ),
                        })
                      }
                    />
                    <Input
                      className="w-24"
                      aria-label="Room capacity"
                      type="number"
                      value={r.capacity}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          rooms: (edit.rooms ?? []).map((v, j) =>
                            i === j ? { ...v, capacity: Number(e.target.value) } : v
                          ),
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={"Delete " + r.name}
                      onClick={() =>
                        setEdit({
                          ...edit,
                          rooms: (edit.rooms ?? []).filter((v) => v.id !== r.id),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Room name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                  <Input
                    aria-label="New room capacity"
                    className="w-24"
                    type="number"
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  />
                  <Button
                    variant="outline"
                    disabled={!roomName}
                    onClick={() => {
                      setEdit({
                        ...edit,
                        rooms: [
                          ...(edit.rooms ?? []),
                          { id: crypto.randomUUID(), name: roomName, capacity: roomCapacity },
                        ],
                      });
                      setRoomName("");
                    }}
                  >
                    <Plus />
                  </Button>
                </div>
                <h3 className="font-semibold mt-6 mb-3">Card readers</h3>
                {data.readers
                  .filter((r) => r.facilityId === edit.id)
                  .map((r) => (
                    <div className="summary-line text-sm mb-3" key={r.id}>
                      <span>{r.label}</span>
                      <Switch
                        checked={r.online}
                        aria-label={r.label + " online"}
                        onCheckedChange={(online) =>
                          update((w) => ({
                            ...w,
                            readers: w.readers.map((v) => (v.id === r.id ? { ...v, online } : v)),
                          }))
                        }
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              disabled={!edit?.name}
              onClick={() => {
                if (!edit) return;
                update((w) => ({
                  ...w,
                  facilities: w.facilities.some((f) => f.id === edit.id)
                    ? w.facilities.map((f) => (f.id === edit.id ? edit : f))
                    : [...w.facilities, edit],
                }));
                setEdit(null);
              }}
            >
              Save facility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Readers() {
  const { data, update } = useWorkspace();
  const [edit, setEdit] = useState<Reader | null>(null);
  const [search, setSearch] = useState("");

  return (
    <>
      <Heading
        title="Card readers"
        description="Assign NFC readers to facilities and rooms."
        action={
          <Button
            onClick={() =>
              setEdit({
                id: "RDR-" + Math.floor(1200 + Math.random() * 9000),
                label: "",
                facilityId: "",
                roomId: "",
                online: true,
              })
            }
          >
            <Plus />
            Add reader
          </Button>
        }
      />
      <div className="admin-stats mb-6">
        {[
          ["Total readers", data.readers.length],
          ["Online", data.readers.filter((r) => r.online).length],
          ["Offline", data.readers.filter((r) => !r.online).length],
          ["Unassigned", data.readers.filter((r) => !r.facilityId).length],
        ].map(([k, v]) => (
          <div className="dashboard-panel" key={k}>
            <p className="text-sm text-muted-foreground">{k}</p>
            <strong className="text-2xl block mt-2">{v}</strong>
          </div>
        ))}
      </div>
      <Input
        className="max-w-lg mb-5"
        placeholder="Search readers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {["Reader ID", "Label", "Facility", "Room / Hall", "Status", ""].map((v) => (
                <th key={v}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.readers
              .filter((r) => (r.id + " " + r.label).toLowerCase().includes(search.toLowerCase()))
              .map((r) => (
                <tr key={r.id}>
                  <td className="font-mono">{r.id}</td>
                  <td>{r.label}</td>
                  <td>{data.facilities.find((f) => f.id === r.facilityId)?.name ?? "Unassigned"}</td>
                  <td>
                    {data.facilities.find((f) => f.id === r.facilityId)?.rooms?.find((v) => v.id === r.roomId)
                      ?.name ?? "Main entrance"}
                  </td>
                  <td>
                    <label className="flex gap-2 items-center">
                      <Switch
                        checked={r.online}
                        onCheckedChange={(online) =>
                          update((w) => ({
                            ...w,
                            readers: w.readers.map((v) => (v.id === r.id ? { ...v, online } : v)),
                          }))
                        }
                      />
                      <span className={r.online ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                        {r.online ? "Online" : "Offline"}
                      </span>
                    </label>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={"Identify " + r.id}
                      onClick={() =>
                        toast(r.online ? "Reader " + r.id + " is blinking" : "Reader is offline")
                      }
                    >
                      <Nfc />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={"Edit " + r.id}
                      onClick={() => setEdit(r)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={"Delete " + r.id}
                      onClick={() =>
                        update((w) => ({
                          ...w,
                          readers: w.readers.filter((v) => v.id !== r.id),
                        }))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.label ? "Edit reader" : "Add reader"}</DialogTitle>
            <DialogDescription>Link a reader to a facility entrance or room.</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="grid gap-4">
              <Field label="Reader ID">
                <Input value={edit.id} onChange={(e) => setEdit({ ...edit, id: e.target.value })} />
              </Field>
              <Field label="Label">
                <Input value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} />
              </Field>
              <Field label="Facility">
                <select
                  className="form-select"
                  value={edit.facilityId}
                  onChange={(e) => setEdit({ ...edit, facilityId: e.target.value, roomId: "" })}
                >
                  <option value="">Unassigned</option>
                  {data.facilities.map((f) => (
                    <option value={f.id} key={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Room / Hall">
                <select
                  className="form-select"
                  value={edit.roomId}
                  onChange={(e) => setEdit({ ...edit, roomId: e.target.value })}
                >
                  <option value="">Main entrance</option>
                  {data.facilities
                    .find((f) => f.id === edit.facilityId)
                    ?.rooms?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </Field>
              <label className="summary-line">
                Online
                <Switch
                  checked={edit.online}
                  onCheckedChange={(online) => setEdit({ ...edit, online })}
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              disabled={!edit?.label || !edit?.id}
              onClick={() => {
                if (!edit) return;
                update((w) => ({
                  ...w,
                  readers: w.readers.some((r) => r.id === edit.id)
                    ? w.readers.map((r) => (r.id === edit.id ? edit : r))
                    : [...w.readers, edit],
                }));
                setEdit(null);
              }}
            >
              Save reader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
