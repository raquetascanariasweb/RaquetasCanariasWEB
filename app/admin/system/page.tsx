'use client'

import { useEffect, useState } from 'react'
import {
  Shield, Server, Activity, Database, Clock, RefreshCw, CheckCircle, XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSystemHealth, setupStoragePublicBucket, runBannerPositionMigration } from '@/lib/admin/system'
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
    else { toast.success('Bucket is now public'); load() }
  }

  async function handleRunMigration() {
    const res = await runBannerPositionMigration()
    if (res?.error) toast.error(res.error)
    else { toast.success('Migration complete â€” text position columns added'); load() }
  }

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
    return `${d}d ${h}h ${m}m`
  }

  const statusCards = [
    { label: 'Node Version', value: data.node_version, icon: Server, status: null as string | null },
    { label: 'Platform', value: data.platform, icon: Activity, status: null },
    { label: 'Uptime', value: formatUptime(data.uptime_seconds), icon: Clock, status: null },
    { label: 'Memory', value: `${data.memory_usage_mb} MB`, icon: Database, status: null },
  ]

  const services = [
    { label: 'Supabase', configured: data.supabase_connected, status: data.supabase_connected ? 'Connected' : 'Disconnected' },
    { label: 'Stripe', configured: data.stripe_configured, status: data.stripe_configured ? 'Configured' : 'Missing Key' },
    { label: 'Clerk', configured: data.clerk_configured, status: data.clerk_configured ? 'Configured' : 'Missing Key' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif tracking-wider text-foreground">System</h1>
        <p className="text-sm text-muted-foreground mt-1">System status and configuration</p>
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
            Services Status
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
            Storage Bucket (product-images)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">Public access</span>
              {data.storage_bucket_public === null ? (
                <Badge variant="outline" className="text-admin-warning border-admin-warning/30 bg-admin-warning/5">Unknown</Badge>
              ) : data.storage_bucket_public ? (
                <Badge variant="outline" className="text-admin-success border-admin-success/30 bg-admin-success/5">Public</Badge>
              ) : (
                <Badge variant="outline" className="text-admin-danger border-admin-danger/30 bg-admin-danger/5">Private</Badge>
              )}
            </div>
            {data.storage_bucket_public === false && (
              <Button size="sm" onClick={handleMakeBucketPublic}>Make Public</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database size={14} className="text-muted-foreground" />
            Database Migrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Banner text position (v6)</p>
              <p className="text-xs text-muted-foreground">Adds text_x / text_y columns to banners table</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleRunMigration}>Run Migration</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <RefreshCw size={14} className="text-muted-foreground" />
            Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.env_checks.map((env) => (
              <div
                key={env.key}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
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
                  {env.configured ? 'Set' : 'Missing'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

