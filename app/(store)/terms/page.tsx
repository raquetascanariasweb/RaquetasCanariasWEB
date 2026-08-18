import Link from "next/link"
import { getShippingSettings } from "@/lib/settings-public"

function buildSections(shippingRate: number, freeThreshold: number) {
  return [
    {
      id: "precios",
      title: "1. Precios",
      content: (
        <>
          <p>Todos los precios expuestos en www.sportbalin.com son con impuestos incluidos.</p>
          <p>Los precios podrán ser revisados y modificados si las condiciones lo requieren en cualquier momento, sin que ello afecte a los pedidos ya confirmados.</p>
          <p>Todos los productos que SPORTBALIN promocione u oferte a un precio especial estarán disponibles a ese precio de promoción solo hasta la fecha indicada, salvo fin de existencias.</p>
        </>
      ),
    },
    {
      id: "medios-de-pago",
      title: "2. Medios de Pago",
      content: (
        <>
          <p className="font-medium text-ink">2.1 Tarjeta de crédito — TPV Virtual</p>
          <p>El pago con tarjeta de crédito se realiza mediante plataforma de pago segura proporcionada por la entidad bancaria. Toda la transacción relacionada con el pago se realizará a través de los sistemas de la entidad bancaria, garantizando la confidencialidad de tus datos.</p>

          <p className="font-medium text-ink">2.2 Transferencia bancaria</p>
          <p>Si seleccionas como medio de pago la transferencia bancaria, recibirás junto con la confirmación de tu pedido un email donde se te indicará el número de cuenta en el que efectuar la transferencia a nombre de SPORTBALIN.</p>
          <p>Es muy importante que indiques el número de pedido, así como tu nombre y apellidos, y realices la transferencia dentro de los 3 días posteriores a la fecha de confirmación del pedido. Una vez realizada, envía el justificante a <a href="mailto:sportbalin@gmail.com" className="text-ember underline underline-offset-2">sportbalin@gmail.com</a>.</p>
          <p>No se considerará efectivo el pedido hasta que nuestro departamento de administración tenga confirmación bancaria de la transferencia.</p>
          <p>El pago debe realizarse en euros. Todas las eventuales comisiones de cambio y bancarias corren por cuenta del comprador al optar por este sistema de pago. En el caso de transferencias desde fuera de España, es importante que comuniques a tu banco hacerse cargo de las comisiones en origen. De no ser así, SPORTBALIN podría paralizar el envío de tu pedido al no recibir la cantidad íntegra.</p>

          <p className="font-medium text-ink">2.3 PayPal</p>
          <p>PayPal permite enviar pagos en Internet de forma segura, cómoda y rentable. La red de PayPal se basa en la infraestructura financiera existente de cuentas bancarias y tarjetas de crédito para crear una solución global de pago en tiempo real.</p>
          <p>
            Para más información puedes visitar la web de{" "}
            <a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer" className="text-ember underline underline-offset-2">
              PayPal
            </a>.
          </p>
        </>
      ),
    },
    {
      id: "envios",
      title: "3. Formas de Envío y Plazos de Entrega",
      content: (
        <>
          <p>SPORTBALIN garantiza la entrega mediante correos certificado, en un plazo de 4-5 días hábiles una vez validado el pedido, siempre que correos cumpla con sus plazos de entrega.</p>
          <p>Los plazos se computan en días laborables y pueden verse alterados por festivos locales o nacionales.</p>
          <p>Si la forma de pago elegida es transferencia bancaria, no se realizará el envío hasta que tengamos confirmación bancaria de la transferencia.</p>
          <p>SPORTBALIN se reserva el derecho de variar el tipo de envío y la compañía por la cual se efectúa este, independientemente de lo expuesto en estas páginas, siempre que no suponga un perjuicio manifiesto para el cliente.</p>
          <p className="font-semibold text-ink">Atención: No realizamos envíos a apartados postales.</p>

          <div className="mt-6 p-4 bg-linen/60 rounded-xl border border-[#DDD8CC]">
            <p className="font-semibold text-ink mb-2">Envíos a domicilio</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#6B6863]">
              <li>Península: <strong className="text-ink">{shippingRate} €</strong>. Gratuito para pedidos superiores a <strong className="text-ink">{freeThreshold} €</strong>.</li>
              <li>Europa y resto del mundo: consultar portes en <a href="mailto:sportbalin@gmail.com" className="text-ember underline underline-offset-2">sportbalin@gmail.com</a>.</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-ember/5 rounded-xl border border-ember/15">
            <p className="font-semibold text-ember mb-2">Envío gratuito</p>
            <p>Los gastos de envío serán gratuitos para pedidos superiores a {freeThreshold} €. Durante el proceso de compra, si tu pedido supera ese importe, podrás seleccionar la opción &laquo;Envío Gratuito&raquo; junto al resto de opciones de envío.</p>
            <p className="mt-2">Aplica a envíos realizados en España, tanto en territorio peninsular como en Canarias.</p>
          </div>
        </>
      ),
    },
  {
    id: "garantia",
    title: "4. Garantía",
    content: (
      <>
        <p>Los clientes de SPORTBALIN se benefician de la garantía ofrecida por los distintos fabricantes de cada uno de los artículos.</p>
        <p>Los defectos o desperfectos debidos a una incorrecta utilización o manipulación del material, así como los desgastes producidos por un uso normal del mismo, no se incluyen en esta garantía.</p>
      </>
    ),
  },
  {
    id: "devoluciones",
    title: "5. Devoluciones y Cambios de Material",
    content: (
      <>
        <p>Si por cualquier motivo no quedas satisfecho con tu pedido, tienes un plazo de <strong className="text-ink">10 días hábiles</strong> desde la fecha de entrega para devolverlo (según art. 44 de la Ley 7/1996, de 15 de enero de Ordenación del Comercio Minorista).</p>

        <h3 className="font-medium text-ink mt-6 mb-2">Condiciones para la devolución</h3>
        <ul className="space-y-1.5 list-disc list-inside text-[#6B6863]">
          <li>El producto debe estar en perfectas condiciones, sin usar y en su embalaje original, incluyendo garantías, etiquetas e instrucciones de uso.</li>
          <li>El envío de la devolución hasta nuestro almacén corre a cargo del cliente. En caso de cambio, no tendrás que pagar los gastos de envío del nuevo pedido.</li>
          <li>Es muy importante que nos devuelvas los productos perfectamente embalados. Si los productos resultan dañados debido a un embalaje inapropiado, no admitiremos la devolución.</li>
          <li>No se admitirá la devolución de cualquier producto precintado si carece del precinto original.</li>
        </ul>

        <h3 className="font-medium text-ink mt-6 mb-2">Proceso de devolución</h3>
        <p>Para realizar un cambio o devolución, envía un email a <a href="mailto:sportbalin@gmail.com" className="text-ember underline underline-offset-2">sportbalin@gmail.com</a> y te indicaremos cómo proceder.</p>
        <p className="font-semibold text-ink">Importante: SPORTBALIN no admite envíos a portes debidos. Antes de cualquier cambio, contacta con Atención al Cliente.</p>

        <h3 className="font-medium text-ink mt-6 mb-2">Reintegro del importe</h3>
        <p>Una vez recibamos la mercancía en nuestros almacenes y comprobemos que se cumplen todas las condiciones, procederemos al reintegro del importe:</p>
        <ul className="space-y-1.5 list-disc list-inside text-[#6B6863]">
          <li>Si pagaste con tarjeta de crédito, te abonaremos el importe en la misma tarjeta.</li>
          <li>Si pagaste contra reembolso o mediante transferencia, te solicitaremos un número de cuenta donde abonar el importe.</li>
        </ul>
        <p className="mt-3">Recibirás el reintegro en un plazo máximo de <strong className="text-ink">5 días</strong> desde la recepción del producto en nuestro almacén. Si pagaste con tarjeta, es probable que tu banco no refleje el importe hasta el mes siguiente.</p>
      </>
    ),
  },
  {
    id: "proteccion-de-datos",
    title: "6. Protección de Datos de Carácter Personal",
    content: (
      <>
        <p>En cumplimiento de lo establecido en la Ley Orgánica 15/1999, de 13 de diciembre, de Protección de Datos de Carácter Personal, te informamos de que los datos personales que nos facilites serán incluidos en un fichero automatizado creado y mantenido bajo la responsabilidad de SPORTBALIN.</p>
        <p>La finalidad de dicho fichero es facilitar la tramitación de los pedidos y, en caso de que nos hayas autorizado expresamente, enviarte comunicaciones comerciales sobre productos, ofertas, bonos descuento y servicios que puedan resultar de tu interés. Si no deseas recibir estas comunicaciones, indícanoslo enviando un email a <a href="mailto:sportbalin@gmail.com" className="text-ember underline underline-offset-2">sportbalin@gmail.com</a>.</p>
        <p>Podrás ejercitar en todo momento los derechos de acceso, rectificación, cancelación y oposición comunicándolo por correo electrónico a <a href="mailto:sportbalin@gmail.com" className="text-ember underline underline-offset-2">sportbalin@gmail.com</a>.</p>
      </>
    ),
  },
  {
    id: "legislacion",
    title: "7. Legislación Aplicable y Jurisdicción Competente",
    content: (
      <>
        <p>Las presentes condiciones generales se interpretarán conforme a la legislación vigente en España en la materia, que se aplicará subsidiariamente en todo lo que no se haya previsto en las mismas (Ley 34/2002 de 11 de julio de servicios de la información y comercio electrónico).</p>
      </>
    ),
  },
  ]
}

export default async function TermsPage() {
  const { shippingRate, freeThreshold } = await getShippingSettings()
  const sections = buildSections(shippingRate, freeThreshold)

  return (
    <main className="flex-1 pt-16 sm:pt-18">
      <section className="bg-gradient-to-br from-slate via-[#1a1a1a] to-black py-16 sm:py-20">
        <div className="container-main text-center">
          <p className="text-paper/60 text-xs font-semibold uppercase tracking-[0.15em] mb-3">
            Normas Generales de Venta
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-paper leading-[1.1]">
            Condiciones de Venta
          </h1>
          <p className="mt-3 text-paper/70 text-base max-w-lg mx-auto">
            Información sobre precios, envíos, devoluciones y protección de datos.
          </p>
        </div>
      </section>

      <section className="container-main py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <nav className="lg:w-72 shrink-0">
            <div className="flex lg:flex-col gap-1 lg:sticky lg:top-24 overflow-x-auto pb-2 lg:pb-0">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="shrink-0 px-4 py-2 rounded-lg text-sm text-[#8A8680] hover:text-ink hover:bg-ink/5 transition-colors whitespace-nowrap"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0 space-y-16">
            {sections.map((s) => (
              <article key={s.id} id={s.id}>
                <h2 className="font-display text-2xl font-bold text-ink mb-6 pb-4 border-b border-[#DDD8CC]">
                  {s.title}
                </h2>
                <div className="space-y-4 text-[#6B6863] leading-relaxed">
                  {s.content}
                </div>
              </article>
            ))}

            <div className="pt-6 border-t border-[#DDD8CC]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-ember hover:text-ember/80 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </svg>
                Volver a la tienda
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
