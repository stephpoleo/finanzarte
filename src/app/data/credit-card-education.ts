export const CREDIT_EDUCATION = {
  minimumPayment: {
    title: '¿Por qué el pago mínimo no conviene?',
    shortDescription: 'La mayor parte de tu pago va a intereses, no a reducir tu deuda.',
    points: [
      'La mayor parte va a intereses, no a reducir tu deuda',
      'Puedes tardar 5-10 años en pagar una compra',
      'Terminas pagando 2-3 veces el valor original',
      'El banco gana más mientras tú pagas menos'
    ],
    example: {
      balance: 15000,
      rate: 65,
      minimumPayment: 450,
      monthsToPayoff: 94,
      totalInterest: 27180,
      totalPaid: 42180
    }
  },

  cat: {
    title: '¿Qué es el CAT?',
    shortDescription: 'El Costo Anual Total es el costo REAL de tu tarjeta.',
    description: 'El CAT (Costo Anual Total) incluye todo lo que pagas por usar tu tarjeta: intereses, comisiones, seguros y IVA. Es el número que debes comparar entre tarjetas.',
    components: [
      { name: 'Intereses', description: 'El porcentaje que cobran por prestarte dinero' },
      { name: 'Comisiones', description: 'Anualidad, disposición de efectivo, etc.' },
      { name: 'Seguros', description: 'Seguros obligatorios incluidos' },
      { name: 'IVA', description: '16% sobre intereses y comisiones' }
    ],
    tip: 'El CAT promedio en México para tarjetas de crédito es de 60-90%. Mientras menor sea, mejor.'
  },

  paymentTypes: {
    minimum: {
      label: 'Pago mínimo',
      description: 'Lo mínimo que el banco acepta. Evita que te cobren mora, pero genera intereses sobre el resto.',
      warning: 'No es lo mismo que "no deber nada". Si solo pagas esto, tu deuda crece.'
    },
    noInterest: {
      label: 'Pago para no generar intereses',
      description: 'El saldo total de tu último corte. Si pagas esto completo, no pagas intereses.',
      tip: 'Es el número que aparece como "Saldo al corte" o "Para no generar intereses" en tu estado de cuenta.'
    },
    total: {
      label: 'Saldo total',
      description: 'Todo lo que debes incluyendo compras recientes. Es el máximo que puedes pagar.',
      tip: 'Incluye compras que aún no aparecen en tu estado de cuenta.'
    }
  },

  alerts: {
    minimumPaymentWarning: {
      title: 'Estás pagando solo el mínimo',
      message: 'Al pagar solo el mínimo, la mayor parte va a intereses. Considera pagar más para liquidar más rápido.'
    },
    highUtilization: {
      title: 'Utilización alta de tu crédito',
      message: 'Usar más del 30% de tu límite puede afectar tu historial crediticio.',
      threshold: 0.3
    },
    highDebtRatio: {
      title: 'Compromiso de deuda alto',
      message: 'Tus pagos de tarjetas representan un porcentaje alto de tu ingreso.',
      threshold: 0.3
    }
  },

  tips: [
    'Paga siempre más que el mínimo, aunque sea un poco más',
    'Si puedes, paga el saldo completo cada mes para no pagar intereses',
    'Compara el CAT, no solo la tasa de interés, al elegir tarjetas',
    'Revisa tu estado de cuenta para conocer tu fecha de corte y pago',
    'Evita disposiciones de efectivo, tienen comisiones y tasas más altas'
  ]
};

export type CreditEducationKey = keyof typeof CREDIT_EDUCATION;
