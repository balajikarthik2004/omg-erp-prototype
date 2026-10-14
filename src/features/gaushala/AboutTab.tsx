import { useState } from 'react'
import { Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { toast } from '@/lib/toast'
import { useDb } from '@/store/db'
import { CowIcon, FodderIcon } from './GaushalaArt'

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Can I give if I live outside the country?',
    a: 'Yes, and most people who keep this herd fed do. Prices are shown in your own currency, the card is charged in the entity’s currency, and the rate used is printed on your receipt.',
  },
  {
    q: 'What actually happens after I pay for a sewa?',
    a: 'It goes into the fulfilment queue, a caretaker is assigned, and when it is carried out they attach a photograph or a video. That proof is emailed to you and sits in your devotee account.',
  },
  {
    q: 'Can I ask for a sewa on a particular date?',
    a: 'On any sewa that shows a date picker, yes — a birthday, an anniversary, a remembrance day. Pick the date at checkout and it is done that morning.',
  },
  {
    q: 'Is my gift tax-deductible?',
    a: 'That depends on which legal entity receives it and where you live. The receipt you get carries the right wording for your country, and the registration numbers are listed under Transparency.',
  },
  {
    q: 'Can I visit?',
    a: 'Yes. Visiting hours are below. Slot booking, guided tours and school visits open in the next release — until then, telephone and we will arrange it.',
  },
  {
    q: 'What is the single most useful thing to give?',
    a: 'Green fodder. It is bought fresh every morning, it is the largest line in the monthly accounts, and it is the first thing that runs short.',
  },
]

export function AboutTab() {
  const entities = useDb((s) => s.gaushalaEntities)
  const entity = entities.find((e) => e.isDefault) ?? entities[0]

  return (
    <div className="space-y-10">
      {/* mission */}
      <section className="rounded-card border border-sandal-200 bg-sandal-50 p-6 shadow-card sm:p-8">
        <h2 className="font-display text-[24px] leading-tight text-stone-900 sm:text-[28px]">
          Why there is a cow shelter attached to a temple
        </h2>
        <div className="mt-4 max-w-3xl space-y-3.5 text-[15px] leading-relaxed text-stone-700">
          <p>
            It started with six animals and a gate nobody had planned to open. A cow walked into the yard during the
            2023 floods and would not leave. Five more arrived that fortnight.
          </p>
          <p>
            Three years on there are sixteen. Some were surrendered by families who could no longer feed them, some
            were bought at a market an hour before they would have been loaded onto a lorry, and three came off that
            lorry at the district border. Two were born here.
          </p>
          <p>
            None of them will be sold, worked or moved on. That is the whole undertaking, and everything on this page
            exists to pay for it.
          </p>
        </div>

        <dl className="mt-7 grid gap-4 sm:grid-cols-3">
          <Figure icon={<CowIcon size={20} />} value="16" label="cows, calves and bulls" />
          <Figure icon={<FodderIcon size={20} />} value="9" label="bundles of green fodder a day" />
          <Figure icon={<ShieldCheck className="size-5" aria-hidden />} value="0" label="animals ever sold on" />
        </dl>
      </section>

      {/* visiting and contact */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-sandal-200 bg-white p-6 shadow-card">
          <h3 className="font-display text-[20px] text-stone-900">Visiting</h3>
          <dl className="mt-4 space-y-3.5 text-[14px] text-stone-700">
            <Line icon={<Clock className="size-4" aria-hidden />} label="Open">
              Every day except Tuesday, 6:30&nbsp;am&nbsp;–&nbsp;10:00&nbsp;am and 4:00&nbsp;pm&nbsp;–&nbsp;6:30&nbsp;pm
            </Line>
            <Line icon={<MapPin className="size-4" aria-hidden />} label="Where">
              {entity?.address ?? 'Thiruparankundram Road, Madurai'}
            </Line>
            <Line icon={<Phone className="size-4" aria-hidden />} label="Telephone">
              +91 452 249 1108
            </Line>
            <Line icon={<Mail className="size-4" aria-hidden />} label="Email">
              gaushala@omg.org
            </Line>
          </dl>

          <div className="mt-5 rounded-xl border border-sandal-200 bg-sandal-100 p-4">
            <h4 className="text-[11.5px] font-extrabold tracking-[0.12em] text-stone-500 uppercase">
              Before you come
            </h4>
            <ul className="mt-2.5 space-y-1.5 text-[13.5px] leading-relaxed text-stone-700">
              <li>Please do not bring plastic of any kind into the yard. It is what puts most of these cows on the operating table.</li>
              <li>Feed only what a caretaker hands you.</li>
              <li>No flash photography near the sick shed.</li>
              <li>Children are very welcome, holding an adult&rsquo;s hand.</li>
            </ul>
          </div>
        </div>

        <ContactForm />
      </section>

      {/* faq */}
      <section>
        <h3 className="font-display text-[22px] text-stone-900">Questions we are asked</h3>
        <ul className="mt-4 space-y-2.5">
          {FAQS.map((faq) => (
            <li key={faq.q}>
              <details className="group rounded-card border border-sandal-200 bg-white px-5 py-4 shadow-card">
                <summary className="cursor-pointer list-none font-display text-[16.5px] text-stone-900 marker:content-none">
                  <span className="flex items-start justify-between gap-4">
                    {faq.q}
                    <span
                      className="mt-1 shrink-0 text-[20px] leading-none text-stone-500 transition-transform duration-200 group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-stone-700">{faq.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>

      {/* legal */}
      <section className="rounded-card border border-sandal-200 bg-sandal-50 p-6 shadow-card">
        <h3 className="font-display text-[18px] text-stone-900">Policies</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-stone-700">
          Privacy policy, terms, and the refund and cancellation policy are published with the rest of the
          organisation&rsquo;s policies. A sewa can be cancelled for a full refund any time before it is assigned to a
          caretaker; once it has been carried out it cannot, because the fodder has been bought and eaten.
        </p>
        <p className="mt-3 text-[13px] text-stone-500">
          Registration numbers and audited accounts are listed under Transparency.
        </p>
      </section>
    </div>
  )
}

function Figure({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sandal-200 bg-white px-4 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-navy-100 bg-navy-50 text-navy-600">
        {icon}
      </span>
      <span>
        <dd className="font-display text-[22px] leading-none text-stone-900">{value}</dd>
        <dt className="mt-1 text-[12.5px] text-stone-500">{label}</dt>
      </span>
    </div>
  )
}

function Line({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-stone-500">{icon}</span>
      <span>
        <dt className="text-[11.5px] font-extrabold tracking-[0.12em] text-stone-500 uppercase">{label}</dt>
        <dd className="mt-0.5 leading-relaxed">{children}</dd>
      </span>
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (name.trim().length < 2) next.name = 'Tell us who you are.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'We need a working email to reply to.'
    if (message.trim().length < 10) next.message = 'A sentence or two, so we know what to answer.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    toast.success('Message sent', 'Someone at the shelter will reply within two working days.')
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-sandal-200 bg-white p-6 shadow-card">
      <h3 className="font-display text-[20px] text-stone-900">Write to us</h3>
      <p className="mt-1.5 text-[13.5px] text-stone-500">
        About a sewa, a visit, or an animal you have seen that needs help.
      </p>

      <div className="mt-5 space-y-4">
        <Input
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Textarea
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={errors.message}
          placeholder="How can we help?"
        />
      </div>

      <Button type="submit" className="mt-5" fullWidth>
        Send message
      </Button>
      <p className="mt-2.5 text-[12px] leading-relaxed text-stone-500">
        We use your email only to reply. It is never added to a mailing list without you asking.
      </p>
    </form>
  )
}
