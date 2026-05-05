import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, BookOpen, Camera, Calendar, Settings, LogOut, Users, Copy } from "lucide-react"

async function getDashboardData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get profile with couple info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, couples(*)")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  let stats = {
    diaryEntries: 0,
    memories: 0,
    specialDates: 0,
  }

  let partner = null

  if (profile.couple_id) {
    // Get diary entries count
    const { count: diaryCount } = await supabase
      .from("diary_entries")
      .select("*", { count: "exact", head: true })
      .eq("couple_id", profile.couple_id)

    // Get memories count
    const { count: memoriesCount } = await supabase
      .from("memories")
      .select("*", { count: "exact", head: true })
      .eq("couple_id", profile.couple_id)

    // Get special dates count
    const { count: datesCount } = await supabase
      .from("special_dates")
      .select("*", { count: "exact", head: true })
      .eq("couple_id", profile.couple_id)

    stats = {
      diaryEntries: diaryCount || 0,
      memories: memoriesCount || 0,
      specialDates: datesCount || 0,
    }

    // Get partner
    const { data: partnerData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("couple_id", profile.couple_id)
      .neq("id", user.id)
      .single()

    partner = partnerData
  }

  return {
    user,
    profile,
    couple: profile.couples,
    partner,
    stats,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    redirect("/auth/login")
  }

  const { profile, couple, partner, stats } = data

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">CoupleDiary</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Ola, {profile.display_name || "Usuario"}
            </span>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Couple Status */}
        {!couple ? (
          <Card className="mb-8 border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Comece sua jornada juntos</CardTitle>
              <CardDescription>
                Crie um novo casal ou entre com um codigo de convite do seu parceiro(a)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/couple/create">Criar Casal</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/couple/join">Entrar com Codigo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Couple Info Card */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {couple.name || "Nosso Casal"}
                    </CardTitle>
                    <CardDescription>
                      {partner
                        ? `Voce e ${partner.display_name}`
                        : "Aguardando seu parceiro(a) entrar"}
                    </CardDescription>
                  </div>
                  {!partner && couple.invite_code && (
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Codigo de convite
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold tracking-wider">
                          {couple.invite_code}
                        </code>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Entradas do Diario</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.diaryEntries}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Memorias</CardTitle>
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.memories}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Datas Especiais</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.specialDates}</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <h2 className="mb-4 text-lg font-semibold">Acoes Rapidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-md">
            <Link href="/diary/new" className="block p-6">
              <BookOpen className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Nova Entrada</h3>
              <p className="text-sm text-muted-foreground">
                Escreva sobre o seu dia
              </p>
            </Link>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <Link href="/memories/new" className="block p-6">
              <Camera className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Nova Memoria</h3>
              <p className="text-sm text-muted-foreground">
                Registre um momento especial
              </p>
            </Link>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <Link href="/dates" className="block p-6">
              <Calendar className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Datas Especiais</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie datas importantes
              </p>
            </Link>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <Link href="/settings" className="block p-6">
              <Settings className="mb-4 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Configuracoes</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie sua conta
              </p>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
