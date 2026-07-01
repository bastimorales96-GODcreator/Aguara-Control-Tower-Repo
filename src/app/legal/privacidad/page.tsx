import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad — Aguara",
  description: "Política de privacidad de Aguara Business Control Tower.",
}

const UPDATED = "11 de junio de 2026"

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-gray-500">Última actualización: {UPDATED}</p>

        <section className="mt-8 space-y-4 leading-relaxed">
          <p>
            En <strong>Aguara</strong> (&quot;Aguara&quot;, &quot;nosotros&quot;) nos tomamos en serio la
            privacidad y la protección de los datos. Esta política explica qué datos tratamos cuando
            conectás tu tienda y usás nuestro panel de control de negocio, con qué finalidad, cómo los
            protegemos y cuáles son tus derechos.
          </p>
        </section>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">1. Qué datos tratamos</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
          <li>
            <strong>Datos de tu cuenta:</strong> email y datos de registro que usás para acceder a Aguara.
          </li>
          <li>
            <strong>Credenciales de conexión:</strong> los tokens de acceso (OAuth) que tu plataforma de
            e-commerce (Tiendanube, Shopify) o tus plataformas de ads (Meta, Google) generan al autorizar
            la conexión. Se almacenan cifrados.
          </li>
          <li>
            <strong>Datos comerciales de tu tienda:</strong> órdenes, productos, métricas de ventas y de
            campañas publicitarias, que leemos a través de las APIs oficiales para mostrarte tus reportes.
          </li>
        </ul>
        <p className="mt-3 leading-relaxed">
          Aguara accede a estos datos en <strong>modo solo lectura</strong>. Nunca modificamos, creamos ni
          eliminamos información en tu tienda, tus productos ni tus órdenes.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">2. Con qué finalidad</h2>
        <p className="mt-3 leading-relaxed">
          Usamos los datos exclusivamente para prestarte el servicio: calcular y mostrar métricas de ventas,
          rentabilidad, ROAS y CPA, y demás reportes dentro de tu panel. No vendemos ni alquilamos tus datos
          a terceros, ni los usamos para publicidad.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">3. Proveedores</h2>
        <p className="mt-3 leading-relaxed">
          Para operar el servicio utilizamos proveedores de infraestructura que tratan datos por nuestra
          cuenta bajo acuerdos de confidencialidad: alojamiento de la aplicación (Vercel), base de datos y
          autenticación (Supabase), y las APIs de las plataformas que conectás (Tiendanube, Shopify, Meta,
          Google).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">4. Seguridad y conservación</h2>
        <p className="mt-3 leading-relaxed">
          Las credenciales se almacenan cifradas y el acceso está restringido. Conservamos los datos mientras
          tu cuenta y la conexión estén activas. Cuando desinstalás la app o desconectás una tienda,
          eliminamos las credenciales y los datos de conexión asociados.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">5. Tus derechos</h2>
        <p className="mt-3 leading-relaxed">
          Podés solicitar el acceso, la rectificación o la eliminación de tus datos personales, así como
          desconectar tus tiendas en cualquier momento desde el panel. Para ejercer estos derechos,
          escribinos a{" "}
          <a href="mailto:hola@aguara.io" className="text-blue-600 underline">
            hola@aguara.io
          </a>
          . Cumplimos con los mecanismos de protección de datos requeridos por las plataformas con las que
          integramos, incluyendo las solicitudes de eliminación y de reporte de datos de Tiendanube
          (LGPD/GDPR).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-gray-900">6. Contacto</h2>
        <p className="mt-3 leading-relaxed">
          Si tenés dudas sobre esta política o sobre el tratamiento de tus datos, contactanos en{" "}
          <a href="mailto:hola@aguara.io" className="text-blue-600 underline">
            hola@aguara.io
          </a>
          .
        </p>

        <p className="mt-12 text-xs text-gray-400">
          Aguara — Business Control Tower
        </p>
      </div>
    </main>
  )
}
