// utils/dateFormatter.js
import moment from 'moment';

export default function formatDate(timestamp) {
  const date = moment(timestamp);

  if (date.isSame(moment(), 'day')) {
    return `Today at ${date.format('HH:mm')}`;
  } if (date.isSame(moment().subtract(1, 'days'), 'day')) {
    return `Yesterday at ${date.format('HH:mm')}`;
  }
  const daysAgo = date.fromNow();
  return daysAgo.charAt(0).toUpperCase() + daysAgo.slice(1); // Capitalize the first letter
}
