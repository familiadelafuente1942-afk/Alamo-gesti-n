import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Users, ClipboardList, Factory, Package, Boxes,
  Calculator, Plus, ArrowRight, AlertTriangle, CheckCircle2, X,
  Building2, Truck, Layers, Gauge, TrendingUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

/* ------------------------------------------------------------------ */
/*  Bolsas Industriales ÁLAMO — Sistema de gestión (Oficina + Planta)  */
/* ------------------------------------------------------------------ */

const ETAPAS = ["Impresión", "Tubado", "Fondo", "Cosido", "Terminado"];
const MAQUINA_ETAPA = {
  "Impresión": "Impresora Flexo IF-1",
  "Tubado": "Tubadora T-1",
  "Fondo": "Fondera F-2",
  "Cosido": "Cosedora C-1",
};

const ars = (n) =>
  "$ " + Math.round(n).toLocaleString("es-AR");
const miles = (n) => n.toLocaleString("es-AR");

/* Persistencia en localStorage: los datos sobreviven al recargar / offline */
function usePersisted(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

/* --------------------------- seed data ---------------------------- */
const SEED = {
  clientes: [
    { id: 1, nombre: "Cementos del Plata S.A.", cuit: "30-61234567-8", contacto: "compras@cdp.com.ar" },
    { id: 2, nombre: "Molinos Río Paraná", cuit: "30-58876543-2", contacto: "logistica@molinosrp.com" },
    { id: 3, nombre: "Cal Norte S.R.L.", cuit: "30-70998877-1", contacto: "pedidos@calnorte.com.ar" },
    { id: 4, nombre: "Fertilizantes Litoral", cuit: "30-65443322-9", contacto: "abastecimiento@fertlit.com" },
  ],
  materiaPrima: [
    { id: 1, tipo: "Bobina", detalle: "Kraft 80 g/m² · 1.00 m", unidad: "kg", stock: 3200, minimo: 1500, gramaje: 80 },
    { id: 2, tipo: "Bobina", detalle: "Kraft 90 g/m² · 1.10 m", unidad: "kg", stock: 900, minimo: 1200, gramaje: 90 },
    { id: 3, tipo: "Bobina", detalle: "Blanco 70 g/m² · 0.90 m", unidad: "kg", stock: 1800, minimo: 800, gramaje: 70 },
    { id: 4, tipo: "Tinta", detalle: "Flexo Negra", unidad: "kg", stock: 45, minimo: 20 },
    { id: 5, tipo: "Tinta", detalle: "Flexo Azul", unidad: "kg", stock: 12, minimo: 20 },
    { id: 6, tipo: "Insumo", detalle: "Cola vinílica", unidad: "kg", stock: 260, minimo: 100 },
    { id: 7, tipo: "Insumo", detalle: "Hilo de cosido", unidad: "cono", stock: 40, minimo: 15 },
    { id: 8, tipo: "Insumo", detalle: "Válvulas de papel", unidad: "u", stock: 12000, minimo: 5000 },
  ],
  pedidos: [
    { id: 1, clienteId: 1, tipo: "Valvulada 25 kg", medidas: "50×43×10", gramaje: 90, colores: 2, cantidad: 30000, entregaDias: 5, estado: "En producción" },
    { id: 2, clienteId: 2, tipo: "Boca abierta 25 kg", medidas: "48×40×8", gramaje: 70, colores: 1, cantidad: 20000, entregaDias: 8, estado: "Pendiente" },
    { id: 3, clienteId: 3, tipo: "Valvulada 25 kg", medidas: "50×43×10", gramaje: 80, colores: 1, cantidad: 15000, entregaDias: 10, estado: "Pendiente" },
    { id: 4, clienteId: 4, tipo: "Cosida 50 kg", medidas: "60×48×12", gramaje: 90, colores: 2, cantidad: 10000, entregaDias: 12, estado: "Pendiente" },
  ],
  ordenes: [
    { id: 1042, pedidoId: 1, cantidad: 30000, etapa: "Fondo", operario: "R. Sosa", inicio: "hace 2 días" },
  ],
  terminado: [
    { id: 1, producto: "Valvulada 25 kg · Kraft 80", cantidad: 12000 },
    { id: 2, producto: "Boca abierta 25 kg · Blanco 70", cantidad: 5000 },
  ],
  produccion7d: [4.2, 5.1, 3.8, 6.0, 5.5, 4.9, 2.1], // miles de bolsas / día
};

/* ------------------------------------------------------------------ */
export default function AlamoGestion() {
  const [rol, setRol] = useState("oficina"); // 'oficina' | 'planta'
  const [vista, setVista] = useState("inicio");
  const [clientes] = useState(SEED.clientes);
  const [materiaPrima, setMateriaPrima] = usePersisted("alamo.materiaPrima", SEED.materiaPrima);
  const [pedidos, setPedidos] = usePersisted("alamo.pedidos", SEED.pedidos);
  const [ordenes, setOrdenes] = usePersisted("alamo.ordenes", SEED.ordenes);
  const [terminado, setTerminado] = usePersisted("alamo.terminado", SEED.terminado);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const clienteDe = (id) => clientes.find((c) => c.id === id)?.nombre || "—";

  /* --------- KPIs derivados --------- */
  const kpis = useMemo(() => {
    const pendientes = pedidos.filter((p) => p.estado === "Pendiente").length;
    const enProd = ordenes.filter((o) => o.etapa !== "Terminado").length;
    const criticos = materiaPrima.filter((m) => m.stock < m.minimo).length;
    const prodHoy = SEED.produccion7d[SEED.produccion7d.length - 1] * 1000;
    return { pendientes, enProd, criticos, prodHoy };
  }, [pedidos, ordenes, materiaPrima]);

  /* --------- Acciones --------- */
  const generarOP = (pedido) => {
    const nuevoId = 1043 + ordenes.filter((o) => o.id >= 1043).length;
    setOrdenes((prev) => [
      ...prev,
      { id: nuevoId, pedidoId: pedido.id, cantidad: pedido.cantidad, etapa: "Impresión", operario: "Sin asignar", inicio: "recién" },
    ]);
    setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? { ...p, estado: "En producción" } : p)));
    notify(`OP-${nuevoId} generada · ${pedido.tipo}`);
    setVista("produccion");
  };

  const consumirMateriaPrima = (op, pedido) => {
    const papelKg = Math.round(op.cantidad * 0.1);
    const tintaKg = Math.round(op.cantidad * 0.00002 * pedido.colores * 100) / 100;
    const colaKg = Math.round(op.cantidad * 0.002);
    const valvulas = pedido.tipo.includes("Valvulada") ? op.cantidad : 0;
    setMateriaPrima((prev) =>
      prev.map((m) => {
        if (m.tipo === "Bobina" && m.gramaje === pedido.gramaje) return { ...m, stock: Math.max(0, m.stock - papelKg) };
        if (m.detalle === "Flexo Negra") return { ...m, stock: Math.max(0, m.stock - tintaKg) };
        if (m.detalle === "Cola vinílica") return { ...m, stock: Math.max(0, m.stock - colaKg) };
        if (m.detalle === "Válvulas de papel" && valvulas) return { ...m, stock: Math.max(0, m.stock - valvulas) };
        return m;
      })
    );
    return papelKg;
  };

  const avanzarEtapa = (op) => {
    const idx = ETAPAS.indexOf(op.etapa);
    const pedido = pedidos.find((p) => p.id === op.pedidoId);
    if (idx >= ETAPAS.length - 2) {
      // pasa a Terminado → cierra OP
      const papelKg = consumirMateriaPrima(op, pedido);
      const prodNombre = `${pedido.tipo} · ${pedido.gramaje === 70 ? "Blanco 70" : "Kraft " + pedido.gramaje}`;
      setTerminado((prev) => {
        const existe = prev.find((t) => t.producto === prodNombre);
        if (existe) return prev.map((t) => (t.producto === prodNombre ? { ...t, cantidad: t.cantidad + op.cantidad } : t));
        return [...prev, { id: Date.now(), producto: prodNombre, cantidad: op.cantidad }];
      });
      setOrdenes((prev) => prev.map((o) => (o.id === op.id ? { ...o, etapa: "Terminado" } : o)));
      setPedidos((prev) => prev.map((p) => (p.id === op.pedidoId ? { ...p, estado: "Listo para despacho" } : p)));
      notify(`OP-${op.id} terminada · −${miles(papelKg)} kg papel · +${miles(op.cantidad)} bolsas a stock`);
    } else {
      const next = ETAPAS[idx + 1];
      setOrdenes((prev) => prev.map((o) => (o.id === op.id ? { ...o, etapa: next } : o)));
      notify(`OP-${op.id} → ${next} (${MAQUINA_ETAPA[next]})`);
    }
  };

  const reponer = (m) => {
    const cant = m.tipo === "Bobina" ? 2000 : m.unidad === "u" ? 5000 : 50;
    setMateriaPrima((prev) => prev.map((x) => (x.id === m.id ? { ...x, stock: x.stock + cant } : x)));
    notify(`Repuesto: ${m.detalle} +${miles(cant)} ${m.unidad}`);
  };

  /* --------- Navegación por rol --------- */
  const NAV = [
    { id: "inicio", label: "Inicio", icon: LayoutDashboard, roles: ["oficina", "planta"] },
    { id: "clientes", label: "Clientes", icon: Users, roles: ["oficina"] },
    { id: "pedidos", label: "Pedidos", icon: ClipboardList, roles: ["oficina"] },
    { id: "produccion", label: "Producción", icon: Factory, roles: ["oficina", "planta"] },
    { id: "materia", label: "Materia prima", icon: Package, roles: ["oficina", "planta"] },
    { id: "stock", label: "Producto terminado", icon: Boxes, roles: ["oficina", "planta"] },
    { id: "costeo", label: "Costeo", icon: Calculator, roles: ["oficina"] },
  ].filter((n) => n.roles.includes(rol));

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex font-sans">
      {/* -------------------- Sidebar -------------------- */}
      <aside className="w-60 shrink-0 bg-stone-900 text-stone-300 flex flex-col min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-stone-700/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <Layers size={20} className="text-stone-900" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-white tracking-wide">ÁLAMO</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-400/90">Bolsas industriales</div>
            </div>
          </div>
        </div>

        {/* rol switch */}
        <div className="px-4 pt-4">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1.5 pl-1">Modo</div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-800 rounded-lg">
            {["oficina", "planta"].map((r) => (
              <button key={r} onClick={() => { setRol(r); setVista("inicio"); }}
                className={`text-xs font-medium py-1.5 rounded-md capitalize transition ${
                  rol === r ? "bg-amber-500 text-stone-900" : "text-stone-400 hover:text-stone-200"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = vista === n.id;
            return (
              <button key={n.id} onClick={() => setVista(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active ? "bg-stone-800 text-white" : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"}`}>
                <Icon size={17} className={active ? "text-amber-400" : ""} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-stone-700/60 text-[11px] text-stone-500 space-y-2">
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Planta operativa</div>
          <button
            onClick={() => {
              if (confirm("¿Reiniciar todos los datos a los valores de ejemplo?")) {
                ["alamo.materiaPrima", "alamo.pedidos", "alamo.ordenes", "alamo.terminado"].forEach((k) => localStorage.removeItem(k));
                location.reload();
              }
            }}
            className="text-[11px] text-stone-500 hover:text-stone-300 underline underline-offset-2">
            Reiniciar datos
          </button>
        </div>
      </aside>

      {/* -------------------- Main -------------------- */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-stone-100/90 backdrop-blur border-b border-stone-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">{NAV.find((n) => n.id === vista)?.label}</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {rol === "oficina" ? "Vista oficina · pedidos, costeo y despacho" : "Vista planta · producción e insumos"}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
            <Building2 size={14} /> Planta Central · Turno mañana
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {vista === "inicio" && <Inicio kpis={kpis} rol={rol} ordenes={ordenes} pedidos={pedidos} clienteDe={clienteDe} materiaPrima={materiaPrima} />}
          {vista === "clientes" && <Clientes clientes={clientes} pedidos={pedidos} />}
          {vista === "pedidos" && <Pedidos pedidos={pedidos} clienteDe={clienteDe} ordenes={ordenes} onGenerar={generarOP} />}
          {vista === "produccion" && <Produccion ordenes={ordenes} pedidos={pedidos} clienteDe={clienteDe} rol={rol} onAvanzar={avanzarEtapa} />}
          {vista === "materia" && <MateriaPrima materiaPrima={materiaPrima} onReponer={reponer} />}
          {vista === "stock" && <Stock terminado={terminado} />}
          {vista === "costeo" && <Costeo />}
        </div>
      </main>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <CheckCircle2 size={16} className="text-amber-400 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}

/* =============================== INICIO =============================== */
function Inicio({ kpis, rol, ordenes, pedidos, clienteDe, materiaPrima }) {
  const chartData = SEED.produccion7d.map((v, i) => ({ dia: ["L", "M", "X", "J", "V", "S", "D"][i], val: v }));
  const criticos = materiaPrima.filter((m) => m.stock < m.minimo);
  const enCurso = ordenes.filter((o) => o.etapa !== "Terminado");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={ClipboardList} label="Pedidos pendientes" value={kpis.pendientes} tone="sky" />
        <Kpi icon={Factory} label="OP en producción" value={kpis.enProd} tone="amber" />
        <Kpi icon={AlertTriangle} label="Insumos críticos" value={kpis.criticos} tone="red" />
        <Kpi icon={Gauge} label="Bolsas hoy" value={miles(kpis.prodHoy)} tone="emerald" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800 flex items-center gap-2"><TrendingUp size={16} className="text-amber-500" /> Producción · últimos 7 días</h3>
            <span className="text-xs text-stone-400 font-mono">miles de bolsas</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f5f5f4" }} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={i === chartData.length - 1 ? "#d97706" : "#e7d3b0"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="font-semibold text-stone-800 mb-3">{criticos.length ? "Reposición urgente" : "Insumos OK"}</h3>
          {criticos.length === 0 && <p className="text-sm text-stone-500">Todo por encima del mínimo.</p>}
          <div className="space-y-2.5">
            {criticos.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">{m.detalle}</span>
                <span className="font-mono text-red-600 text-xs">{miles(m.stock)}/{miles(m.minimo)} {m.unidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-800 mb-4">Órdenes en la línea</h3>
        <div className="space-y-4">
          {enCurso.length === 0 && <p className="text-sm text-stone-500">No hay órdenes en curso.</p>}
          {enCurso.map((o) => {
            const p = pedidos.find((x) => x.id === o.pedidoId);
            return (
              <div key={o.id} className="border border-stone-100 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-sm">
                    <span className="font-mono font-semibold text-stone-900">OP-{o.id}</span>
                    <span className="text-stone-500"> · {clienteDe(p.clienteId)} · {miles(o.cantidad)} u</span>
                  </div>
                  <span className="text-xs text-stone-400">{o.inicio}</span>
                </div>
                <Stepper etapaActual={o.etapa} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }) {
  const tones = {
    sky: "text-sky-600 bg-sky-50", amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50", emerald: "text-emerald-600 bg-emerald-50",
  };
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}><Icon size={18} /></div>
      <div className="text-2xl font-semibold text-stone-900 font-mono">{value}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
    </div>
  );
}

/* =============================== STEPPER =============================== */
function Stepper({ etapaActual }) {
  const idx = ETAPAS.indexOf(etapaActual);
  return (
    <div className="flex items-center">
      {ETAPAS.map((e, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={e}>
            <div className="flex flex-col items-center">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 ${
                done ? "bg-emerald-500 border-emerald-500 text-white"
                : active ? "bg-amber-500 border-amber-500 text-stone-900"
                : "bg-white border-stone-200 text-stone-400"}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] mt-1 ${active ? "text-amber-700 font-medium" : "text-stone-400"}`}>{e}</span>
            </div>
            {i < ETAPAS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < idx ? "bg-emerald-400" : "bg-stone-200"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* =============================== CLIENTES =============================== */
function Clientes({ clientes, pedidos }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
          <tr><Th>Cliente</Th><Th>CUIT</Th><Th>Contacto</Th><Th className="text-right">Pedidos</Th></tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {clientes.map((c) => (
            <tr key={c.id} className="hover:bg-stone-50">
              <Td className="font-medium text-stone-800">{c.nombre}</Td>
              <Td className="font-mono text-xs text-stone-500">{c.cuit}</Td>
              <Td className="text-stone-500">{c.contacto}</Td>
              <Td className="text-right font-mono">{pedidos.filter((p) => p.clienteId === c.id).length}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =============================== PEDIDOS =============================== */
function Pedidos({ pedidos, clienteDe, ordenes, onGenerar }) {
  const badge = (estado) => {
    const map = {
      "Pendiente": "bg-sky-50 text-sky-700",
      "En producción": "bg-amber-50 text-amber-700",
      "Listo para despacho": "bg-emerald-50 text-emerald-700",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[estado] || "bg-stone-100 text-stone-600"}`}>{estado}</span>;
  };
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
          <tr><Th>Cliente</Th><Th>Producto</Th><Th className="text-right">Cantidad</Th><Th>Entrega</Th><Th>Estado</Th><Th></Th></tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {pedidos.map((p) => {
            const tieneOP = ordenes.some((o) => o.pedidoId === p.id);
            return (
              <tr key={p.id} className="hover:bg-stone-50">
                <Td className="font-medium text-stone-800">{clienteDe(p.clienteId)}</Td>
                <Td className="text-stone-600">{p.tipo}<span className="block text-xs text-stone-400 font-mono">{p.medidas} · {p.gramaje}g · {p.colores} color</span></Td>
                <Td className="text-right font-mono">{miles(p.cantidad)}</Td>
                <Td className="text-stone-500 text-xs">en {p.entregaDias} días</Td>
                <Td>{badge(p.estado)}</Td>
                <Td className="text-right">
                  {p.estado === "Pendiente" && !tieneOP ? (
                    <button onClick={() => onGenerar(p)}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700">
                      Generar OP <ArrowRight size={13} />
                    </button>
                  ) : <span className="text-xs text-stone-400">—</span>}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =============================== PRODUCCIÓN =============================== */
function Produccion({ ordenes, pedidos, clienteDe, rol, onAvanzar }) {
  if (ordenes.length === 0)
    return <Empty icon={Factory} titulo="Sin órdenes de producción" texto="Generá una OP desde un pedido para verla en la línea." />;
  return (
    <div className="space-y-4">
      {ordenes.map((o) => {
        const p = pedidos.find((x) => x.id === o.pedidoId);
        const terminada = o.etapa === "Terminado";
        return (
          <div key={o.id} className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-stone-900">OP-{o.id}</span>
                  {terminada && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">Terminada</span>}
                </div>
                <div className="text-sm text-stone-500 mt-0.5">{clienteDe(p.clienteId)} · {p.tipo}</div>
                <div className="text-xs text-stone-400 font-mono mt-0.5">{miles(o.cantidad)} u · {p.gramaje}g · {p.colores} color · op. {o.operario}</div>
              </div>
              {!terminada && (
                <div className="text-right">
                  <div className="text-xs text-stone-400 mb-1">Máquina actual</div>
                  <div className="text-sm font-medium text-stone-700">{MAQUINA_ETAPA[o.etapa]}</div>
                </div>
              )}
            </div>

            <Stepper etapaActual={o.etapa} />

            {rol === "planta" && !terminada && (
              <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end">
                <button onClick={() => onAvanzar(o)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-amber-500 text-stone-900 px-4 py-2 rounded-lg hover:bg-amber-400">
                  {ETAPAS.indexOf(o.etapa) >= ETAPAS.length - 2 ? "Cerrar y pasar a stock" : "Avanzar etapa"} <ArrowRight size={15} />
                </button>
              </div>
            )}
            {rol === "oficina" && !terminada && (
              <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-400">
                La planta avanza las etapas. Cambiá a modo Planta para operar la línea.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =============================== MATERIA PRIMA =============================== */
function MateriaPrima({ materiaPrima, onReponer }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
          <tr><Th>Insumo</Th><Th>Tipo</Th><Th className="text-right">Stock</Th><Th className="text-right">Mínimo</Th><Th>Estado</Th><Th></Th></tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {materiaPrima.map((m) => {
            const critico = m.stock < m.minimo;
            return (
              <tr key={m.id} className="hover:bg-stone-50">
                <Td className="font-medium text-stone-800">{m.detalle}</Td>
                <Td className="text-stone-500">{m.tipo}</Td>
                <Td className={`text-right font-mono ${critico ? "text-red-600 font-semibold" : "text-stone-700"}`}>{miles(m.stock)} {m.unidad}</Td>
                <Td className="text-right font-mono text-stone-400">{miles(m.minimo)}</Td>
                <Td>
                  {critico
                    ? <span className="inline-flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={13} /> Bajo mínimo</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={13} /> OK</span>}
                </Td>
                <Td className="text-right">
                  <button onClick={() => onReponer(m)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-50">
                    <Plus size={13} /> Reponer
                  </button>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =============================== STOCK =============================== */
function Stock({ terminado }) {
  const total = terminado.reduce((a, t) => a + t.cantidad, 0);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Truck size={22} /></div>
        <div>
          <div className="text-2xl font-mono font-semibold text-stone-900">{miles(total)}</div>
          <div className="text-xs text-stone-500">bolsas terminadas en depósito</div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
            <tr><Th>Producto</Th><Th className="text-right">Cantidad</Th><Th className="text-right">Pallets aprox.</Th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {terminado.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50">
                <Td className="font-medium text-stone-800">{t.producto}</Td>
                <Td className="text-right font-mono">{miles(t.cantidad)}</Td>
                <Td className="text-right font-mono text-stone-500">{Math.ceil(t.cantidad / 5000)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =============================== COSTEO =============================== */
function Costeo() {
  const [f, setF] = useState({ ancho: 50, alto: 43, fuelle: 10, gramaje: 90, cantidad: 30000, colores: 2, margen: 35 });
  const [precios, setPrecios] = useState({ papelKg: 950, tintaKg: 8500, colaKg: 1200, manoObraMillar: 4200 });

  const upd = (k, v) => setF((p) => ({ ...p, [k]: Number(v) || 0 }));
  const updP = (k, v) => setPrecios((p) => ({ ...p, [k]: Number(v) || 0 }));

  const r = useMemo(() => {
    const areaM2 = ((f.ancho + f.fuelle) * 2 * (f.alto + 6)) / 10000 * 1.12; // + 12% desperdicio
    const pesoBolsaKg = (areaM2 * f.gramaje) / 1000;
    const cPapel = pesoBolsaKg * precios.papelKg;
    const cTinta = (f.colores * 0.35 * precios.tintaKg) / 1000;
    const cCola = (0.002 * precios.colaKg);
    const cMO = precios.manoObraMillar / 1000;
    const costoUnit = cPapel + cTinta + cCola + cMO;
    const precioUnit = costoUnit * (1 + f.margen / 100);
    return { areaM2, pesoBolsaKg, costoUnit, precioUnit, totalCosto: costoUnit * f.cantidad, totalVenta: precioUnit * f.cantidad };
  }, [f, precios]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-semibold text-stone-800">Especificación de la bolsa</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Ancho (cm)" value={f.ancho} onChange={(v) => upd("ancho", v)} />
          <Field label="Alto (cm)" value={f.alto} onChange={(v) => upd("alto", v)} />
          <Field label="Fuelle (cm)" value={f.fuelle} onChange={(v) => upd("fuelle", v)} />
          <Field label="Gramaje (g)" value={f.gramaje} onChange={(v) => upd("gramaje", v)} />
          <Field label="Colores" value={f.colores} onChange={(v) => upd("colores", v)} />
          <Field label="Cantidad" value={f.cantidad} onChange={(v) => upd("cantidad", v)} />
        </div>
        <h3 className="font-semibold text-stone-800 pt-2">Precios de referencia (ARS)</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Papel · $/kg" value={precios.papelKg} onChange={(v) => updP("papelKg", v)} />
          <Field label="Tinta · $/kg" value={precios.tintaKg} onChange={(v) => updP("tintaKg", v)} />
          <Field label="Cola · $/kg" value={precios.colaKg} onChange={(v) => updP("colaKg", v)} />
          <Field label="Mano de obra · $/millar" value={precios.manoObraMillar} onChange={(v) => updP("manoObraMillar", v)} />
        </div>
        <div>
          <label className="text-xs text-stone-500">Margen · {f.margen}%</label>
          <input type="range" min="0" max="80" value={f.margen} onChange={(e) => upd("margen", e.target.value)}
            className="w-full accent-amber-500" />
        </div>
      </div>

      <div className="bg-stone-900 rounded-xl p-6 text-white flex flex-col">
        <h3 className="font-semibold text-amber-400 mb-4">Resultado del costeo</h3>
        <Row k="Superficie por bolsa" v={`${r.areaM2.toFixed(3)} m²`} />
        <Row k="Peso de papel por bolsa" v={`${(r.pesoBolsaKg * 1000).toFixed(1)} g`} />
        <div className="h-px bg-stone-700 my-3" />
        <Row k="Costo unitario" v={ars(r.costoUnit)} />
        <Row k="Precio de venta unitario" v={ars(r.precioUnit)} accent />
        <div className="h-px bg-stone-700 my-3" />
        <Row k={`Costo total (${miles(f.cantidad)} u)`} v={ars(r.totalCosto)} />
        <Row k="Venta total" v={ars(r.totalVenta)} big />
        <div className="mt-auto pt-4 text-xs text-stone-500">
          Estimación con 12% de desperdicio. Ajustá los precios de referencia según tu última compra.
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, accent, big }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-stone-300">{k}</span>
      <span className={`font-mono ${big ? "text-xl text-amber-400 font-semibold" : accent ? "text-amber-400 font-medium" : "text-white"}`}>{v}</span>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-stone-500 block mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" />
    </div>
  );
}

/* =============================== helpers UI =============================== */
const Th = ({ children, className = "" }) => <th className={`text-left font-medium px-4 py-3 ${className}`}>{children}</th>;
const Td = ({ children, className = "" }) => <td className={`px-4 py-3 ${className}`}>{children}</td>;

function Empty({ icon: Icon, titulo, texto }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
      <Icon size={32} className="mx-auto text-stone-300 mb-3" />
      <h3 className="font-medium text-stone-700">{titulo}</h3>
      <p className="text-sm text-stone-400 mt-1">{texto}</p>
    </div>
  );
}
