'use client'

import { useEffect, useState } from 'react'
import {
  Shield, Server, Activity, Database, Clock, RefreshCw, CheckCircle, XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSystemHealth, setupStoragePublicBucket } from '@/lib/admin/system'
import type { SystemHealth } from '@/lib/admin/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setData(await getSystemHealth())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleMakeBucketPublic() {
    const res = await setupStoragePublicBucket()
    if (res?.error) toast.error(res.error)
    else { toast.success('El bucket ahora es pÃºblico'); load() }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount via async load()
  useEffect(() => { load() }, [])

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 w-48 bg-muted rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg" />)}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  }

  if (!data) return null

  function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${d}d ${h}h ${m}min`
  }

  const statusCards = [
    { label: 'VersiÃ³n de Node', value: data.node_version, icon: Server, status: null as string | null },
    { label: 'Plataforma', value: data.platform, icon: Activity, status: null },
    { label: 'Tiempo activo', value: formatUptime(data.uptime_seconds), icon: Clock, status: null },
    { label: 'Memoria', value: `${data.memory_usage_mb} MB`, icon: Database, status: null },
  ]

  const services = [
    { label: 'Supabase', configured: data.supabase_connected, status: data.supabase_connected ? 'Conectado' : 'Desconectado' },
    { label: 'Stripe', configured: data.stripe_configured, status: data.stripe_configured ? 'Configurado' : 'Clave no configurada' },
    { label: 'Clerk', configured: data.clerk_configured, status: data.clerk_configured ? 'Configurado' : 'Clave no configurada' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display tracking-wider text-foreground">Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">Estado y configuraciÃ³n del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                <Icon size={14} className="text-muted-foreground/60" />
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <span className="text-sm font-mono">{s.value}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield size={14} className="text-muted-foreground" />
            Estado de los servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.label} className="border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.status}</p>
                </div>
                {s.configured ? (
                  <CheckCircle size={20} className="text-admin-success shrink-0" />
                ) : (
                  <XCircle size={20} className="text-admin-danger shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database size={14} className="text-muted-foreground" />
            Bucket de almacenamiento (product-images)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">Acceso pÃºblico</span>
              {data.storage_bucket_public === null ? (
                <Badge variant="outline" className="text-admin-warning border-admin-warning/30 bg-admin-warning/5">Desconocido</Badge>
              ) : data.storage_bucket_public ? (
                <Badge variant="outline" className="text-admin-success border-admin-success/30 bg-admin-success/5">PÃºblico</Badge>
              ) : (
                <Badge variant="outline" className="text-admin-danger border-admin-danger/30 bg-admin-danger/5">Privado</Badge>
              )}
            </div>
            {data.storage_bucket_public === false && (
              <Button size="sm" onClick={handleMakeBucketPublic}>Hacer pÃºblico</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RefreshCw size={14} className="text-muted-foreground" />
            Variables de entorno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.env_checks.map((env) => (
              <div
                key={env.key}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">{env.key}</span>
                  <span className="text-xs text-muted-foreground">{env.label}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    env.configured
                      ? 'text-admin-success border-admin-success/30 bg-admin-success/5'
                      : 'text-admin-danger border-admin-danger/30 bg-admin-danger/5'
                  }`}
                >
                  {env.configured ? 'Definida' : 'Faltante'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

