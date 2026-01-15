const data = require('../src/data/gearRecommendations.json');
const items = data.items;

console.log('# Gear Builder Product Link Verification');
console.log('');
console.log('## Instructions');
console.log('For each product below, visit the link and verify:');
console.log('1. Link works (not 404)');
console.log('2. Product name matches');
console.log('3. Price is within 20% of listed price');
console.log('');
console.log('If broken, find correct link on:');
console.log('- Official brand site');
console.log('- Amazon');
console.log('- REI.com');
console.log('- Walmart.com');
console.log('');
console.log('Report format: BROKEN | Product Name | Correct URL');
console.log('');
console.log('---');
console.log('');

// Group by category
const byCategory = {};
items.forEach(item => {
  if (!byCategory[item.category]) byCategory[item.category] = [];
  byCategory[item.category].push(item);
});

Object.keys(byCategory).forEach(cat => {
  const catInfo = data.categories[cat];
  console.log('## ' + (catInfo?.icon || '') + ' ' + (catInfo?.name || cat));
  console.log('');
  byCategory[cat].forEach(item => {
    console.log('- [ ] **' + item.brand + ' ' + item.name + '** - $' + item.price);
    console.log('  Link: ' + item.link);
    console.log('');
  });
});
