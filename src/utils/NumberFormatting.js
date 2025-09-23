export const formatLargeMonetaryNumber = (number) => {
  if (number < 0) {
    return "-" + formatLargeMonetaryNumber(-1 * number);
  }
  if (number < 1000) {
    return "$" + number;
  } else if (number >= 1000 && number < 1_000_000) {
    return "$" + (number / 1000).toFixed(1) + "K";
  } else if (number >= 1_000_000 && number < 1_000_000_000) {
    return "$" + (number / 1_000_000).toFixed(1) + "M";
  } else if (number >= 1_000_000_000 && number < 1_000_000_000_000) {
    return "$" + (number / 1_000_000_000).toFixed(1) + "B";
  } else if (number >= 1_000_000_000_000 && number < 1_000_000_000_000_000) {
    return "$" + (number / 1_000_000_000_000).toFixed(1) + "T";
  }
};

export const formatLargeNonMonetaryNumber = (number) => {
  if (number < 0) {
    return "-" + formatLargeMonetaryNumber(-1 * number);
  }
  if (number < 1000) {
    return number;
  } else if (number >= 1000 && number < 1_000_000) {
    return (number / 1000).toFixed(1) + "K";
  } else if (number >= 1_000_000 && number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(1) + "M";
  } else if (number >= 1_000_000_000 && number < 1_000_000_000_000) {
    return (number / 1_000_000_000).toFixed(1) + "B";
  } else if (number >= 1_000_000_000_000 && number < 1_000_000_000_000_000) {
    return (number / 1_000_000_000_000).toFixed(1) + "T";
  }
};

export const formatRatio = (ratio) => {
  return (Math.round(ratio * 100) / 100).toFixed(2);
};


export const formatNumber = (value) => {
  if (value == null) return '-'
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export const formatPercent = (value) => {
  if (value == null) return '-'
  return `${(Number(value) * 100).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  })}%`
}

export const formatToTwoDecimalPlaces = (number) => {
  if (typeof number !== 'number') {
    return '-';
  }
  return number.toFixed(2);
};