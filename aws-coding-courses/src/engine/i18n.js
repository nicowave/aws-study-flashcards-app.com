// Interface language for the course sites.
//
// Most courses are English only (course.languages is unset), and then nothing
// here changes what they show. A bilingual course (Tech Spanish ↔ Tech English)
// sets course.languages = ['es', 'en'], gets a language switch in the header,
// and writes any text that differs by language with both(en, es):
//
//   title: both('Git and everyday development', 'Git y el día a día del desarrollo')
//
// localize(course, lang) swaps each both() for the chosen text. The interface's
// own words (buttons, labels, messages) live in STRINGS below; t('key') reads
// them in the current language and falls back to English. A course can reword
// any of them for itself with course.labels = { key: both(en, es) }.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Marks a both() value, so real data with en/es keys (glossary examples) is never mistaken for one
export const I18N = Symbol.for('studyhub.i18n');

/** Text that differs by interface language. */
export const both = (en, es) => ({ [I18N]: true, en, es });
export const isBoth = (v) => !!(v && typeof v === 'object' && v[I18N]);

/** The text of a both() value in this language (English if missing); anything else as is. */
export const pick = (v, lang) => (isBoth(v) ? (v[lang] ?? v.en ?? v.es) : v);

/** Joins Markdown parts (plain text or both()) into one both(), a blank line between parts. */
export const join = (...parts) => {
  const kept = parts.filter((p) => p !== null && p !== undefined && p !== '');
  return both(kept.map((p) => pick(p, 'en')).join('\n\n'), kept.map((p) => pick(p, 'es')).join('\n\n'));
};

const isPlain = (v) => v !== null && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Array.isArray(v));

/** A copy of a course object with every both() resolved; functions and other values untouched. */
export const localize = (value, lang) => {
  if (isBoth(value)) return localize(pick(value, lang), lang);
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (!isPlain(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = localize(v, lang);
  return out;
};

// ---------- the interface's own words ----------
// Functions take the values shown in their comment. English must stay exactly
// what the English-only courses show today.
export const STRINGS = {
  en: {
    // header and footer
    'nav.tutorials': 'Tutorials',
    'nav.hub': 'Study Hub',
    'nav.signIn': 'Sign in',
    'nav.signOut': 'Sign out',
    'nav.language': 'Language',
    'footer.moreCourses': 'More courses',
    'footer.games': 'Certification games',
    'footer.comingSoon': 'coming soon',
    'footer.allHub': 'All of Level Up Study Hub',
    'footer.devAssociate': 'Developer Associate',
    'footer.cloudPractitioner': 'Cloud Practitioner',
    'footer.fine': (year) => `© ${year} Nico Tek Solutions. Not affiliated with Amazon Web Services. AWS is a trademark of Amazon.com, Inc.`,
    'app.backTo': (title) => `← Back to ${title}`,
    'app.dismiss': 'Dismiss',
    'app.checkingSignIn': 'Checking sign-in…',
    'app.notFoundTitle': "That page isn't here",
    'app.notFoundLink': (title) => `Go to ${title}`,
    'app.pageNotFound': (title) => `Page not found · ${title}`,
    'app.checkoutCancelled': 'Checkout cancelled. Nothing was charged.',
    'app.unlocking': 'Thank you! Unlocking your course…',
    'app.unlocked': (language) => `Unlocked. Every ${language} tutorial is open to you. Enjoy!`,
    'app.unlockSlow': 'Thank you! It can take a minute to unlock: refresh this page shortly.',
    'promo.deal': (single, pro) => `${single}% off the first payment of every course, ${pro}% off Pro`,
    'promo.until': (ends) => `until ${ends}.`,
    'promo.starts': (starts) => `starts ${starts}:`,
    'promo.oneWeek': 'for one week.',
    'promo.seePrices': 'See prices',

    // course home
    'home.continue': 'Continue where you left off',
    'home.startFree': 'Start free',
    'home.seeInside': "See what's inside",
    'home.outcomes': 'By the end, you can',
    'home.tutorials': 'The tutorials',
    'home.tutorialsLede': 'Each one starts with a task someone really gets asked to do at work. Read a little, try it in the practice terminal, check yourself, then build it for real on your own AWS account.',
    'home.free': 'Free',
    'home.locked': '🔒 In the full course',
    'home.finished': '✓ Finished',
    'home.stepsDone': (done, total) => `${done} of ${total} steps`,
    'home.fullCourse': 'The full course',
    'home.haveAccess': 'You have the full course.',
    'home.manageHint': 'Switch between monthly and yearly, update your card, see invoices or cancel in Manage billing.',
    'home.questions': 'Questions',

    // tutorial page
    'unit.name': 'Tutorial',
    'tut.beforeBegin': 'Before you begin',
    'tut.whatYouDo': "What you'll do",
    'tut.step': 'Step',
    'tut.situation': 'The situation',
    'tut.stepsDone': (done, total) => `${done} of ${total} steps done`,
    'tut.finished': '🎉 Tutorial finished',
    'tut.upNext': (title) => `Up next: ${title}.`,
    'tut.wholeCourse': "That's the whole course. Well done.",
    'tut.meta': (unit, number, level, hours) => `${unit} ${number} · ${level} · ~${hours} h`,

    // steps
    'kind.read': 'Read',
    'kind.try': 'Try it',
    'kind.quiz': 'Check',
    'kind.cards': 'Flashcards',
    'kind.build': 'Build it',
    'kind.register': 'Register',
    'kind.rewrite': 'Write it',
    'step.minutes': (n) => `${n} min`,
    'step.doneNext': (label) => `Done, next: ${label}`,
    'step.markDone': 'Mark as done',
    'step.next': (label) => `Next: ${label}`,
    'step.skipTo': (label) => `Skip to: ${label}`,

    // flashcards
    'cards.deckFinished': 'Deck finished:',
    'cards.allCards': (n) => `all ${n} cards.`,
    'cards.again': 'Go through them again',
    'cards.known': (known, total) => `${known} of ${total} known`,
    'cards.showQuestion': 'Show the question',
    'cards.showAnswer': 'Show the answer',
    'cards.answer': 'Answer',
    'cards.question': 'Question',
    'cards.tap': 'Tap to flip',
    'cards.hint': 'Hint',
    'cards.hintLabel': (hint) => `Hint: ${hint}`,
    'cards.notYet': 'Again',
    'cards.gotIt': 'Got it',

    // quiz
    'quiz.correct': 'Correct.',
    'quiz.wrong': 'Not quite.',
    'quiz.score': 'You got',
    'quiz.of': (score, total) => `${score} of ${total}`,
    'quiz.best': (best) => ` (your best: ${best})`,
    'quiz.retry': 'Try again',

    // register step: formal, with the team, or slang
    'register.formal': 'Formal document',
    'register.team': 'With the team',
    'register.slang': 'Slang',
    'register.question': 'Where does this fit best?',

    // rewrite step
    'rewrite.yourText': 'Your text',
    'rewrite.placeholder': 'Write here…',
    'rewrite.check': 'Check my text',
    'rewrite.showModel': 'Show a model answer',
    'rewrite.hideModel': 'Hide the model answer',
    'rewrite.model': 'One good answer',
    'rewrite.passed': 'Well written. Every key term is there.',
    'rewrite.missing': 'Still missing:',
    'rewrite.avoid': 'Change this:',
    'rewrite.tooShort': (n) => `Write at least ${n} words.`,
    'rewrite.source': 'Original',

    // unlock card
    'unlock.signInNote': 'Sign in or create a free account, then come back here to unlock the course.',
    'unlock.soon': 'Purchases open very soon. The free tutorials are ready now.',
    'unlock.failed': 'Checkout could not start. Please try again in a minute.',
    'unlock.sale': (label, percent, ends) => `${label}: ${percent}% off until ${ends}`,
    'unlock.billing': 'Billing period',
    'unlock.monthly': 'Monthly',
    'unlock.yearly': 'Yearly',
    'unlock.save': (percent) => `save ${percent}%`,
    'unlock.perMonth': 'per month',
    'unlock.perYear': 'per year',
    'unlock.firstMonth': 'first month',
    'unlock.firstYear': 'first year',
    'unlock.allTutorials': (count, titles) => `All ${count} tutorials, including ${titles}`,
    'unlock.everyTask': 'Every practice task, quiz and flashcard deck',
    'unlock.project': 'The real-AWS project at the end of each tutorial, for your GitHub portfolio',
    'unlock.progress': 'Progress saved to your Study Hub account, signed in on up to 3 devices',
    'unlock.renews': 'Renews automatically; cancel anytime in Manage billing',
    'unlock.opening': 'Opening secure checkout…',
    'unlock.unlock': (title) => `Unlock ${title}`,
    'unlock.signInToUnlock': 'Sign in to unlock',
    'unlock.orPro': 'Or get Pro: every course and every certification game',
    'unlock.proTrial': (days) => `${days}-day free trial if you have never had Pro (card required; you are charged when the trial ends unless you cancel).`,
    'unlock.getPro': 'Get Pro',
    'unlock.otherSignIn': 'This is already on for your email under your other sign-in. Sign out, then sign in the other way (for example with Google).',
    'unlock.fine': 'Subscriptions renew automatically at the price shown until you cancel. Cancel anytime in Manage billing. Secure payment through Stripe; any sales tax or card processing fee is shown at checkout before you pay. One sign-in works across every Level Up Study Hub site.',
    'unlock.fineSale': ' The sale discount is applied at checkout automatically and covers the first payment.',
    'unlock.terms': 'Terms',
    'unlock.privacy': 'Privacy',
    'billing.manage': 'Manage billing',
    'billing.opening': 'Opening billing…',
    'billing.none': 'Nothing to manage yet: this account has no subscription.',
    'billing.failed': 'Billing could not open. Please try again in a minute.',

    // code blocks
    'code.copy': 'Copy',
    'code.copied': 'Copied',
    'code.run': '▶ Run',
    // sign-in screens (messages from the sign-in service itself stay in English)
    'auth.usernameRequired': 'Username is required',
    'auth.usernameShort': 'Username must be at least 3 characters',
    'auth.emailRequired': 'Email is required',
    'auth.emailInvalid': 'Please enter a valid email address',
    'auth.passwordRequired': 'Password is required',
    'auth.passwordShort': 'Password must be at least 6 characters',
    'auth.passwordsDiffer': 'Passwords do not match',
    'auth.failed': 'Authentication failed',
    'auth.welcomeBack': 'Welcome Back',
    'auth.createAccount': 'Create Account',
    'auth.signInLede': 'Sign in to sync your progress across devices',
    'auth.signedOutDeviceLimit': 'You were signed out on this browser because your account signed in on another device. An account can stay signed in on up to 3 devices.',
    'auth.signUpLede': 'Sign up to save your progress and achievements',
    'auth.googleSignIn': 'Sign in with Google',
    'auth.googleSignUp': 'Sign up with Google',
    'auth.or': 'or',
    'auth.username': 'Username',
    'auth.usernamePlaceholder': 'Enter your username',
    'auth.email': 'Email',
    'auth.emailHint': 'Required for account verification',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Enter your password',
    'auth.hidePassword': 'Hide password',
    'auth.showPassword': 'Show password',
    'auth.forgot': 'Forgot password?',
    'auth.confirmPassword': 'Confirm Password',
    'auth.confirmPlaceholder': 'Confirm your password',
    'auth.signInButton': 'Sign In',
    'auth.signUpButton': 'Sign Up',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.guest': 'Try It Free — No Account Needed',
    'auth.guestHint': 'Preview the first domain and flashcard deck. Progress saves on this device.',
    'reset.title': 'Reset Password',
    'reset.requestLede': "Enter your account's email and we'll send you a reset code",
    'reset.confirmLede': 'Enter the code from the email and choose a new password',
    'reset.codeMissing': 'Enter the code from the email',
    'reset.send': 'Send Reset Code',
    'reset.code': 'Code from the email',
    'reset.newPassword': 'New password',
    'reset.newPlaceholder': 'At least 6 characters',
    'reset.confirm': 'Confirm new password',
    'reset.confirmPlaceholder': 'Type it again',
    'reset.save': 'Save New Password',
    'reset.remembered': 'Remembered it?',
    'reset.back': 'Back to Sign In',
  },

  es: {
    'nav.tutorials': 'Tutoriales',
    'nav.hub': 'Study Hub',
    'nav.signIn': 'Iniciar sesión',
    'nav.signOut': 'Cerrar sesión',
    'nav.language': 'Idioma',
    'footer.moreCourses': 'Más cursos',
    'footer.games': 'Juegos de certificación',
    'footer.comingSoon': 'muy pronto',
    'footer.allHub': 'Todo Level Up Study Hub',
    'footer.devAssociate': 'Developer Associate',
    'footer.cloudPractitioner': 'Cloud Practitioner',
    'footer.fine': (year) => `© ${year} Nico Tek Solutions. Sin relación con Amazon Web Services. AWS es una marca comercial de Amazon.com, Inc.`,
    'app.backTo': (title) => `← Volver a ${title}`,
    'app.dismiss': 'Cerrar',
    'app.checkingSignIn': 'Comprobando la sesión…',
    'app.notFoundTitle': 'Esta página no existe',
    'app.notFoundLink': (title) => `Ir a ${title}`,
    'app.pageNotFound': (title) => `Página no encontrada · ${title}`,
    'app.checkoutCancelled': 'Pago cancelado. No se cobró nada.',
    'app.unlocking': '¡Gracias! Desbloqueando tu curso…',
    'app.unlocked': (language) => `Desbloqueado. Ya puedes abrir todos los tutoriales de ${language}. ¡Disfrútalo!`,
    'app.unlockSlow': '¡Gracias! El desbloqueo puede tardar un minuto: recarga la página en un momento.',
    'promo.deal': (single, pro) => `${single}% de descuento en el primer pago de cada curso, ${pro}% en Pro`,
    'promo.until': (ends) => `hasta el ${ends}.`,
    'promo.starts': (starts) => `empieza el ${starts}:`,
    'promo.oneWeek': 'durante una semana.',
    'promo.seePrices': 'Ver precios',

    'home.continue': 'Seguir donde lo dejaste',
    'home.startFree': 'Empezar gratis',
    'home.seeInside': 'Ver el contenido',
    'home.outcomes': 'Al terminar, podrás',
    'home.tutorials': 'Los tutoriales',
    'home.tutorialsLede': 'Cada uno parte de una tarea que de verdad te piden en el trabajo. Lee un poco, pruébalo en la terminal de práctica, compruébalo y luego constrúyelo de verdad en tu propia cuenta de AWS.',
    'home.free': 'Gratis',
    'home.locked': '🔒 En el curso completo',
    'home.finished': '✓ Terminado',
    'home.stepsDone': (done, total) => `${done} de ${total} pasos`,
    'home.fullCourse': 'El curso completo',
    'home.haveAccess': 'Tienes el curso completo.',
    'home.manageHint': 'Cambia entre mensual y anual, actualiza tu tarjeta, consulta tus facturas o cancela en «Gestionar facturación».',
    'home.questions': 'Preguntas',

    'unit.name': 'Tutorial',
    'tut.beforeBegin': 'Antes de empezar',
    'tut.whatYouDo': 'Qué vas a hacer',
    'tut.step': 'Paso',
    'tut.situation': 'La situación',
    'tut.stepsDone': (done, total) => `${done} de ${total} pasos hechos`,
    'tut.finished': '🎉 Tutorial terminado',
    'tut.upNext': (title) => `Lo siguiente: ${title}.`,
    'tut.wholeCourse': 'Ese es el curso completo. ¡Muy bien hecho!',
    'tut.meta': (unit, number, level, hours) => `${unit} ${number} · ${level} · ~${hours} h`,

    'kind.read': 'Lectura',
    'kind.try': 'Práctica',
    'kind.quiz': 'Comprueba',
    'kind.cards': 'Tarjetas',
    'kind.build': 'Constrúyelo',
    'kind.register': 'Registro',
    'kind.rewrite': 'Escríbelo',
    'step.minutes': (n) => `${n} min`,
    'step.doneNext': (label) => `Hecho, siguiente: ${label}`,
    'step.markDone': 'Marcar como hecho',
    'step.next': (label) => `Siguiente: ${label}`,
    'step.skipTo': (label) => `Saltar a: ${label}`,

    'cards.deckFinished': 'Mazo terminado:',
    'cards.allCards': (n) => `las ${n} tarjetas.`,
    'cards.again': 'Repasarlas otra vez',
    'cards.known': (known, total) => `${known} de ${total} sabidas`,
    'cards.showQuestion': 'Ver la pregunta',
    'cards.showAnswer': 'Ver la respuesta',
    'cards.answer': 'Respuesta',
    'cards.question': 'Pregunta',
    'cards.tap': 'Toca para girar',
    'cards.hint': 'Pista',
    'cards.hintLabel': (hint) => `Pista: ${hint}`,
    'cards.notYet': 'Otra vez',
    'cards.gotIt': 'La sé',

    'quiz.correct': 'Correcto.',
    'quiz.wrong': 'No exactamente.',
    'quiz.score': 'Acertaste',
    'quiz.of': (score, total) => `${score} de ${total}`,
    'quiz.best': (best) => ` (tu mejor resultado: ${best})`,
    'quiz.retry': 'Intentar de nuevo',

    'register.formal': 'Documento formal',
    'register.team': 'Con el equipo',
    'register.slang': 'Jerga',
    'register.question': '¿Dónde encaja mejor?',

    'rewrite.yourText': 'Tu texto',
    'rewrite.placeholder': 'Escribe aquí…',
    'rewrite.check': 'Revisar mi texto',
    'rewrite.showModel': 'Ver una respuesta modelo',
    'rewrite.hideModel': 'Ocultar la respuesta modelo',
    'rewrite.model': 'Una buena respuesta',
    'rewrite.passed': 'Bien escrito. Están todos los términos clave.',
    'rewrite.missing': 'Todavía falta:',
    'rewrite.avoid': 'Cambia esto:',
    'rewrite.tooShort': (n) => `Escribe al menos ${n} palabras.`,
    'rewrite.source': 'Original',

    'unlock.signInNote': 'Inicia sesión o crea una cuenta gratis, y vuelve aquí para desbloquear el curso.',
    'unlock.soon': 'Las compras abren muy pronto. Los tutoriales gratis ya están listos.',
    'unlock.failed': 'No se pudo abrir el pago. Inténtalo de nuevo en un minuto.',
    'unlock.sale': (label, percent, ends) => `${label}: ${percent}% de descuento hasta el ${ends}`,
    'unlock.billing': 'Periodo de facturación',
    'unlock.monthly': 'Mensual',
    'unlock.yearly': 'Anual',
    'unlock.save': (percent) => `ahorras un ${percent}%`,
    'unlock.perMonth': 'al mes',
    'unlock.perYear': 'al año',
    'unlock.firstMonth': 'el primer mes',
    'unlock.firstYear': 'el primer año',
    'unlock.allTutorials': (count, titles) => `Los ${count} tutoriales, incluidos ${titles}`,
    'unlock.everyTask': 'Todos los ejercicios, quizzes y mazos de tarjetas',
    'unlock.project': 'El proyecto con AWS real al final de cada tutorial, para tu portafolio de GitHub',
    'unlock.progress': 'Tu progreso guardado en tu cuenta de Study Hub, con la sesión abierta en hasta 3 dispositivos',
    'unlock.renews': 'Se renueva automáticamente; cancela cuando quieras en «Gestionar facturación»',
    'unlock.opening': 'Abriendo el pago seguro…',
    'unlock.unlock': (title) => `Desbloquear ${title}`,
    'unlock.signInToUnlock': 'Inicia sesión para desbloquear',
    'unlock.orPro': 'O hazte Pro: todos los cursos y todos los juegos de certificación',
    'unlock.proTrial': (days) => `${days} días gratis si nunca tuviste Pro (se pide una tarjeta; se cobra al terminar la prueba, salvo que canceles antes).`,
    'unlock.getPro': 'Hazte Pro',
    'unlock.otherSignIn': 'Ya está activo para tu correo con tu otra forma de iniciar sesión. Cierra la sesión y vuelve a entrar de la otra forma (por ejemplo, con Google).',
    'unlock.fine': 'Las suscripciones se renuevan automáticamente al precio indicado hasta que las canceles. Cancela cuando quieras en «Gestionar facturación». Pago seguro con Stripe; los impuestos o comisiones de tarjeta, si los hay, se muestran antes de pagar. Un solo inicio de sesión sirve en todos los sitios de Level Up Study Hub.',
    'unlock.fineSale': ' El descuento se aplica solo al pagar y cubre el primer pago.',
    'unlock.terms': 'Términos',
    'unlock.privacy': 'Privacidad',
    'billing.manage': 'Gestionar facturación',
    'billing.opening': 'Abriendo la facturación…',
    'billing.none': 'Todavía no hay nada que gestionar: esta cuenta no tiene ninguna suscripción.',
    'billing.failed': 'No se pudo abrir la facturación. Inténtalo de nuevo en un minuto.',

    'code.copy': 'Copiar',
    'code.copied': 'Copiado',
    'code.run': '▶ Ejecutar',
    // sign-in screens (messages from the sign-in service itself stay in English)
    'auth.usernameRequired': 'Escribe un nombre de usuario',
    'auth.usernameShort': 'El nombre de usuario debe tener al menos 3 caracteres',
    'auth.emailRequired': 'Escribe tu correo electrónico',
    'auth.emailInvalid': 'Escribe un correo electrónico válido',
    'auth.passwordRequired': 'Escribe una contraseña',
    'auth.passwordShort': 'La contraseña debe tener al menos 6 caracteres',
    'auth.passwordsDiffer': 'Las contraseñas no coinciden',
    'auth.failed': 'No se pudo iniciar sesión',
    'auth.welcomeBack': 'Hola de nuevo',
    'auth.createAccount': 'Crear cuenta',
    'auth.signInLede': 'Inicia sesión para sincronizar tu progreso entre dispositivos',
    'auth.signedOutDeviceLimit': 'Se cerró tu sesión en este navegador porque tu cuenta inició sesión en otro dispositivo. Una cuenta puede tener la sesión abierta en hasta 3 dispositivos.',
    'auth.signUpLede': 'Regístrate para guardar tu progreso y tus logros',
    'auth.googleSignIn': 'Iniciar sesión con Google',
    'auth.googleSignUp': 'Registrarse con Google',
    'auth.or': 'o',
    'auth.username': 'Nombre de usuario',
    'auth.usernamePlaceholder': 'Escribe tu nombre de usuario',
    'auth.email': 'Correo electrónico',
    'auth.emailHint': 'Lo necesitamos para verificar tu cuenta',
    'auth.password': 'Contraseña',
    'auth.passwordPlaceholder': 'Escribe tu contraseña',
    'auth.hidePassword': 'Ocultar contraseña',
    'auth.showPassword': 'Mostrar contraseña',
    'auth.forgot': '¿Olvidaste tu contraseña?',
    'auth.confirmPassword': 'Confirma la contraseña',
    'auth.confirmPlaceholder': 'Escribe la contraseña otra vez',
    'auth.signInButton': 'Iniciar sesión',
    'auth.signUpButton': 'Registrarse',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.haveAccount': '¿Ya tienes cuenta?',
    'auth.guest': 'Pruébalo gratis, sin cuenta',
    'auth.guestHint': 'Prueba el primer dominio y el primer mazo de tarjetas. El progreso se guarda en este dispositivo.',
    'reset.title': 'Restablecer la contraseña',
    'reset.requestLede': 'Escribe el correo de tu cuenta y te enviaremos un código',
    'reset.confirmLede': 'Escribe el código del correo y elige una contraseña nueva',
    'reset.codeMissing': 'Escribe el código del correo',
    'reset.send': 'Enviar el código',
    'reset.code': 'Código del correo',
    'reset.newPassword': 'Contraseña nueva',
    'reset.newPlaceholder': 'Al menos 6 caracteres',
    'reset.confirm': 'Confirma la contraseña nueva',
    'reset.confirmPlaceholder': 'Escríbela otra vez',
    'reset.save': 'Guardar la contraseña nueva',
    'reset.remembered': '¿Te acordaste?',
    'reset.back': 'Volver a iniciar sesión',
  },
};

/** The text for key in lang (English when missing); functions get args. A course's
 * own labels (course.labels, already localized) win over STRINGS. */
export const translate = (lang, key, args = [], labels) => {
  const v = labels?.[key] ?? STRINGS[lang]?.[key] ?? STRINGS.en[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(...args) : v;
};

// ---------- the current language ----------
const STORAGE_KEY = 'awsCourse_lang';

/** Language to start in: saved choice, else the browser's, else the course's default. */
export const initialLanguage = (languages, fallback, { stored, browser = [] } = {}) => {
  if (stored && languages.includes(stored)) return stored;
  for (const b of browser) {
    const base = String(b).toLowerCase().split('-')[0];
    if (languages.includes(base)) return base;
  }
  return languages.includes(fallback) ? fallback : languages[0];
};

const readStored = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
const writeStored = (lang) => { try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ } };

const LangContext = createContext({ lang: 'en', languages: ['en'], setLang: () => {} });

const ENGLISH_ONLY = ['en'];

export const LangProvider = ({ languages = ENGLISH_ONLY, defaultLanguage, children }) => {
  const [lang, setLangState] = useState(() => (languages.length > 1
    ? initialLanguage(languages, defaultLanguage, { stored: readStored(), browser: typeof navigator === 'undefined' ? [] : navigator.languages || [navigator.language] })
    : languages[0]));
  const setLang = useCallback((next) => {
    if (!languages.includes(next)) return;
    setLangState(next);
    writeStored(next);
  }, [languages]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({ lang, languages, setLang }), [lang, languages, setLang]);
  return React.createElement(LangContext.Provider, { value }, children);
};

export const useLang = () => useContext(LangContext);

/** t('key', ...args) in the current language. Pass the localized course to use its labels. */
export const useT = (course) => {
  const { lang } = useLang();
  const labels = course?.labels;
  return useCallback((key, ...args) => translate(lang, key, args, labels), [lang, labels]);
};

// One localized copy per language, so step objects keep their identity between renders
const cache = new WeakMap();
/** The course with every both() resolved for the current language (English-only courses: unchanged). */
export const useLocalized = (course) => {
  const { lang } = useLang();
  if (!course.languages || course.languages.length < 2) return course;
  let perLang = cache.get(course);
  if (!perLang) { perLang = {}; cache.set(course, perLang); }
  if (!perLang[lang]) perLang[lang] = localize(course, lang);
  return perLang[lang];
};
