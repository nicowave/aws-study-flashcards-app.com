// The "How much is it?" FAQ entry every course shows, built from services/prices.js so no course
// types a price. English courses use pricingFaq(); the bilingual course uses pricingFaqBoth().
import { both } from '../engine/i18n';
import { PRODUCT_MONTHLY, PRODUCT_YEARLY, PRO_YEARLY, PRO_TRIAL_DAYS, YEARLY_SAVINGS_PERCENT } from '../services/prices';

// Written with the old name; the Markdown renderer keeps the visitor on the name they opened.
const PLANS_URL = 'https://aws-study-flashcards-app.com/#plans';

const Q_EN = 'How much is it? Is it in Pro?';
const Q_ES = '¿Cuánto cuesta? ¿Está incluido en Pro?';

const answerEn = (unit) => `The full course is ${PRODUCT_MONTHLY} a month or ${PRODUCT_YEARLY} a year (yearly saves ${YEARLY_SAVINGS_PERCENT}%). `
  + 'It renews automatically until you cancel, and you can cancel anytime in **Manage billing**. '
  + `[Pro](${PLANS_URL}) is ${PRO_YEARLY} a year and includes every course and every certification game, `
  + `with a ${PRO_TRIAL_DAYS}-day free trial if you have never had Pro. `
  + `The free ${unit} stay free, and a course bought with a one-time payment before subscriptions stays unlocked.`;

const answerEs = `El curso completo cuesta ${PRODUCT_MONTHLY} al mes o ${PRODUCT_YEARLY} al año (con el plan anual ahorras un ${YEARLY_SAVINGS_PERCENT}%). `
  + 'Se renueva automáticamente hasta que lo canceles, y puedes cancelarlo cuando quieras en **Gestionar facturación**. '
  + `[Pro](${PLANS_URL}) cuesta ${PRO_YEARLY} al año e incluye todos los cursos y todos los juegos de certificación, `
  + `con ${PRO_TRIAL_DAYS} días gratis si nunca tuviste Pro. `
  + 'Los módulos gratis siguen siendo gratis, y si compraste el curso con un pago único antes de las suscripciones, sigue desbloqueado.';

/** FAQ entry for an English-only course. */
export const pricingFaq = () => ({ q: Q_EN, a: answerEn('tutorials') });

/** FAQ entry for a bilingual (es/en) course whose units are modules. */
export const pricingFaqBoth = () => ({ q: both(Q_EN, Q_ES), a: both(answerEn('modules'), answerEs) });
