import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, Database, Eye } from "lucide-react";
import type { DbQueryParams } from "@/types/api";

interface DbServiceApi {
  tables: () => Promise<any[]>;
  query: (params: DbQueryParams) => Promise<any[]>;
  getRecord: (table: string, recordId: string, idColumn?: string) => Promise<any>;
}

interface ExplorerPageProps {
  title: string;
  description: string;
  api: DbServiceApi;
}

interface FilterEntry { column: string; value: string; }

export default function DataExplorerPage({ title, description, api }: ExplorerPageProps) {
  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState<unknown>(null);

  const [selectedTable, setSelectedTable] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<unknown>(null);

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<FilterEntry[]>([]);

  const [recordDetail, setRecordDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadTables = useCallback(async () => {
    setTablesLoading(true); setTablesError(null);
    try {
      const res = await api.tables();
      const names = Array.isArray(res) ? res.map((t: any) => t.table_name || t.name || String(t)).filter(Boolean) : [];
      setTables(names);
      if (names.length && !selectedTable) setSelectedTable(names[0]);
    } catch (e) { setTablesError(e); }
    finally { setTablesLoading(false); }
  }, [api]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const runQuery = useCallback(async () => {
    if (!selectedTable) return;
    setDataLoading(true); setDataError(null);
    try {
      const filterMap: Record<string, string> = {};
      filters.forEach(f => { if (f.column && f.value) filterMap[f.column] = f.value; });
      const params: DbQueryParams = { table: selectedTable, limit, offset, filters: filterMap };
      if (orderBy) { params.order_by = orderBy; params.order_dir = orderDir; }
      const res = await api.query(params);
      setData(Array.isArray(res) ? res : []);
    } catch (e) { setDataError(e); }
    finally { setDataLoading(false); }
  }, [api, selectedTable, limit, offset, orderBy, orderDir, filters]);

  useEffect(() => { if (selectedTable) { setOffset(0); runQuery(); } }, [selectedTable]);

  const viewRecord = async (record: any) => {
    const idCol = Object.keys(record).find(k => k === "id" || k.endsWith("_id")) || "id";
    const idVal = record[idCol];
    if (!idVal) { setRecordDetail(record); setDetailOpen(true); return; }
    try {
      const detail = await api.getRecord(selectedTable, String(idVal), idCol);
      setRecordDetail(detail);
      setDetailOpen(true);
    } catch { setRecordDetail(record); setDetailOpen(true); }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const addFilter = () => setFilters([...filters, { column: "", value: "" }]);
  const removeFilter = (i: number) => setFilters(filters.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, field: "column" | "value", val: string) => {
    const next = [...filters]; next[i] = { ...next[i], [field]: val }; setFilters(next);
  };

  if (tablesError) return <ErrorDisplay error={tablesError} onRetry={loadTables} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title={title} description={description} />

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Query Builder</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs">Table</Label>
              {tablesLoading ? <Skeleton className="h-9 w-full mt-1" /> : (
                <Select value={selectedTable} onValueChange={v => { setSelectedTable(v); setOffset(0); }}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{tables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-xs">Limit</Label>
              <Input type="number" className="h-9 mt-1" value={limit} onChange={e => setLimit(Math.min(500, Math.max(1, Number(e.target.value))))} />
            </div>
            <div>
              <Label className="text-xs">Order By</Label>
              <Input className="h-9 mt-1" placeholder="column name" value={orderBy} onChange={e => setOrderBy(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Direction</Label>
              <Select value={orderDir} onValueChange={v => setOrderDir(v as "asc" | "desc")}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filters.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Filters</Label>
              {filters.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="column" className="h-8 flex-1" value={f.column} onChange={e => updateFilter(i, "column", e.target.value)} />
                  <span className="text-muted-foreground text-xs">:</span>
                  <Input placeholder="value" className="h-8 flex-1" value={f.value} onChange={e => updateFilter(i, "value", e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => removeFilter(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addFilter} className="gap-1"><Plus className="h-3.5 w-3.5" />Filter</Button>
            <Button size="sm" onClick={runQuery} className="gap-1"><Search className="h-3.5 w-3.5" />Run Query</Button>
          </div>
        </CardContent>
      </Card>

      {dataError ? (
        <ErrorDisplay error={dataError} onRetry={runQuery} />
      ) : dataLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState icon={Database} title="No data" description={selectedTable ? "Query returned no results. Try adjusting filters." : "Select a table to begin."} />
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">#</TableHead>
                  {columns.map(col => (
                    <TableHead key={col} className="text-xs whitespace-nowrap cursor-pointer hover:text-foreground" onClick={() => { setOrderBy(col); setOrderDir(prev => prev === "asc" ? "desc" : "asc"); }}>
                      {col} {orderBy === col ? (orderDir === "asc" ? "↑" : "↓") : ""}
                    </TableHead>
                  ))}
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground">{offset + i + 1}</TableCell>
                    {columns.map(col => (
                      <TableCell key={col} className="text-xs max-w-[200px] truncate" title={String(row[col] ?? "")}>
                        {row[col] === null || row[col] === undefined ? <span className="text-muted-foreground/50 italic">null</span> : String(row[col])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => viewRecord(row)}><Eye className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{data.length} row{data.length !== 1 ? "s" : ""} (offset {offset})</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => { setOffset(Math.max(0, offset - limit)); setTimeout(runQuery, 0); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={data.length < limit} onClick={() => { setOffset(offset + limit); setTimeout(runQuery, 0); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Detail</DialogTitle></DialogHeader>
          {recordDetail && (
            <div className="space-y-2">
              {Object.entries(recordDetail).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm border-b border-border pb-2 last:border-0">
                  <span className="font-medium text-foreground min-w-[120px] shrink-0">{k}</span>
                  <span className="text-muted-foreground break-all">
                    {v === null || v === undefined ? <span className="italic opacity-50">null</span> : typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
