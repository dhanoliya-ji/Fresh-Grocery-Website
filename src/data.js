// Freshly Market catalog. Edit products, prices and text here.
// img: photo file in public/img/p · cut: true when a transparent cut-out exists in public/img/c
// nutrition: approximate values per 100 g (for display only)

export const STORE = {
  name: 'Freshly',
  tagline: 'Market',
  freeDeliveryOver: 35,
  deliveryFee: 4.99,
  serviceFee: 0.99,
  currency: 'USD',
};

export const CATEGORIES = [
  { id: 'fruits', name: 'Fruits', blurb: 'Sweet, juicy, picked ripe', color: '#ffe3d6', hero: 'strawberries' },
  { id: 'vegetables', name: 'Vegetables', blurb: 'Crunchy greens & roots', color: '#e2f3d8', hero: 'broccoli' },
  { id: 'dairy', name: 'Dairy & Eggs', blurb: 'Farm-fresh every morning', color: '#fdf1d2', hero: 'eggs' },
  { id: 'bakery', name: 'Bakery', blurb: 'Baked before sunrise', color: '#f7e4cc', hero: 'croissant' },
  { id: 'meat', name: 'Meat & Seafood', blurb: 'Butcher & fishmonger cuts', color: '#fbdcdc', hero: 'salmon' },
  { id: 'pantry', name: 'Pantry', blurb: 'Grains, oils & staples', color: '#f1e6d6', hero: 'rice' },
  { id: 'snacks', name: 'Snacks', blurb: 'Treats worth sharing', color: '#efe2f4', hero: 'chocolate' },
  { id: 'drinks', name: 'Drinks', blurb: 'Juices, teas & sparkling', color: '#dcf0f5', hero: 'lemons' },
];

const P = (id, name, cat, price, unit, img, o = {}) => ({
  id, name, cat, price, unit, img,
  old: o.old || null,
  badges: o.badges || [],
  rating: o.rating || 4.6,
  reviews: o.reviews || 120,
  origin: o.origin || 'Local farms',
  desc: o.desc || '',
  kcal: o.kcal ?? null,
  protein: o.protein ?? null,
  carbs: o.carbs ?? null,
  fat: o.fat ?? null,
  cut: o.cut ?? false,
  weights: o.weights || null,
});

export const PRODUCTS = [
  // ---------------- fruits ----------------
  P('apples', 'Honeycrisp Apples', 'fruits', 3.99, '1 lb', 'apples', { cut: true, badges: ['Organic'], rating: 4.8, reviews: 412, origin: 'Hudson Valley, NY', desc: 'Explosively crisp and honey-sweet. Great for snacking, salads and pies.', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, weights: ['1 lb', '2 lb', '3 lb'] }),
  P('bananas', 'Bananas', 'fruits', 0.69, '1 lb', 'bananas', { cut: true, rating: 4.7, reviews: 980, origin: 'Ecuador', desc: 'Sunshine-yellow and naturally sweet, the perfect on-the-go snack.', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }),
  P('strawberries', 'Strawberries', 'fruits', 4.49, '1 lb', 'strawberries', { cut: true, old: 5.99, badges: ['Sale'], rating: 4.8, reviews: 530, origin: 'Watsonville, CA', desc: 'Plump, ruby-red berries picked at peak ripeness.', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 }),
  P('oranges', 'Navel Oranges', 'fruits', 1.29, 'each', 'oranges', { cut: true, rating: 4.6, reviews: 288, origin: 'Florida', desc: 'Seedless, easy to peel and bursting with juice.', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 }),
  P('avocados', 'Hass Avocados', 'fruits', 1.79, 'each', 'avocados', { cut: true, badges: ['Organic'], rating: 4.5, reviews: 611, origin: 'Michoacán, Mexico', desc: 'Buttery and rich. Ripe in 1–2 days on the counter.', kcal: 160, protein: 2, carbs: 8.5, fat: 15 }),
  P('lemons', 'Lemons', 'fruits', 0.79, 'each', 'lemons', { cut: true, rating: 4.7, reviews: 174, origin: 'California', desc: 'Bright, zesty and full of juice.', kcal: 29, protein: 1.1, carbs: 9.3, fat: 0.3 }),
  P('blueberries', 'Blueberries', 'fruits', 4.99, '6 oz', 'blueberries', { cut: true, badges: ['Organic'], rating: 4.8, reviews: 342, origin: 'New Jersey', desc: 'Tiny, sweet antioxidant powerhouses.', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 }),
  P('grapes', 'Green Seedless Grapes', 'fruits', 3.49, '1 lb', 'grapes', { cut: true, rating: 4.5, reviews: 205, origin: 'California', desc: 'Crisp, juicy and refreshingly sweet.', kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 }),
  P('watermelon', 'Watermelon Wedge', 'fruits', 3.99, '2 lb', 'watermelon', { rating: 4.4, reviews: 96, origin: 'Georgia', desc: 'Cold, crunchy and summer in every bite.', kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2 }),
  P('mango', 'Ataulfo Mango', 'fruits', 1.49, 'each', 'mango', { cut: true, old: 1.99, badges: ['Sale'], rating: 4.7, reviews: 158, origin: 'Mexico', desc: 'Silky, fiber-free flesh with a tropical perfume.', kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 }),
  P('pineapple', 'Golden Pineapple', 'fruits', 3.99, 'each', 'pineapple', { cut: true, rating: 4.6, reviews: 131, origin: 'Costa Rica', desc: 'Extra-sweet with a golden, juicy center.', kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 }),
  P('kiwi', 'Kiwifruit', 'fruits', 0.59, 'each', 'kiwi', { cut: true, rating: 4.5, reviews: 88, origin: 'New Zealand', desc: 'Tangy-sweet emerald slices packed with vitamin C.', kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 }),
  // ---------------- vegetables ----------------
  P('tomatoes', 'Vine Tomatoes', 'vegetables', 2.99, '1 lb', 'tomatoes', { cut: true, rating: 4.6, reviews: 267, origin: 'Lancaster, PA', desc: 'Ripened on the vine for deep, sweet flavour.', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }),
  P('carrots', 'Carrots', 'vegetables', 1.49, '2 lb', 'carrots', { cut: true, badges: ['Organic'], rating: 4.7, reviews: 190, origin: 'Upstate NY', desc: 'Sweet, crunchy and perfect for roasting.', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 }),
  P('broccoli', 'Broccoli Crowns', 'vegetables', 2.29, '1 lb', 'broccoli', { cut: true, rating: 4.6, reviews: 214, origin: 'Salinas, CA', desc: 'Tight green florets, tender stems.', kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 }),
  P('peppers', 'Bell Pepper Trio', 'vegetables', 3.99, '3 ct', 'peppers', { cut: true, old: 4.79, badges: ['Sale'], rating: 4.7, reviews: 176, origin: 'Holland', desc: 'Red, orange and yellow: sweet and snappy.', kcal: 31, protein: 1, carbs: 6, fat: 0.3 }),
  P('cucumber', 'English Cucumber', 'vegetables', 1.29, 'each', 'cucumber', { cut: true, rating: 4.5, reviews: 102, origin: 'Local greenhouse', desc: 'Thin-skinned, seedless and cool.', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 }),
  P('spinach', 'Baby Spinach', 'vegetables', 3.49, '5 oz', 'spinach', { badges: ['Organic'], rating: 4.6, reviews: 233, origin: 'Arizona', desc: 'Tender, triple-washed leaves ready to eat.', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }),
  P('potatoes', 'Yukon Gold Potatoes', 'vegetables', 3.99, '5 lb', 'potatoes', { cut: true, rating: 4.7, reviews: 301, origin: 'Idaho', desc: 'Creamy, golden and made for mashing.', kcal: 77, protein: 2, carbs: 17, fat: 0.1 }),
  P('onions', 'Yellow Onions', 'vegetables', 1.99, '3 lb', 'onions', { cut: true, rating: 4.5, reviews: 145, origin: 'Washington', desc: 'The kitchen essential. Sweetens as it cooks.', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 }),
  P('corn', 'Sweet Corn', 'vegetables', 0.79, 'each', 'corn', { rating: 4.6, reviews: 97, origin: 'New Jersey', desc: 'Juicy kernels, great grilled with butter.', kcal: 86, protein: 3.2, carbs: 19, fat: 1.2 }),
  P('mushrooms', 'Mushroom Medley', 'vegetables', 4.49, '8 oz', 'mushrooms', { cut: true, rating: 4.5, reviews: 84, origin: 'Kennett Square, PA', desc: 'Brown beech, shiitake and oyster mix.', kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 }),
  P('garlic', 'Garlic Bulbs', 'vegetables', 0.99, '2 ct', 'garlic', { cut: true, rating: 4.8, reviews: 121, origin: 'California', desc: 'Pungent and aromatic. Every recipe needs it.', kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 }),
  P('lettuce', 'Romaine Hearts', 'vegetables', 2.99, '3 ct', 'lettuce', { cut: true, rating: 4.5, reviews: 139, origin: 'Salinas, CA', desc: 'Crisp, sweet hearts for the perfect Caesar.', kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.3 }),
  // ---------------- dairy ----------------
  P('milk', 'Whole Milk', 'dairy', 3.79, '½ gal', 'milk', { rating: 4.7, reviews: 522, origin: 'Vermont dairy co-op', desc: 'Creamy, grass-fed and non-homogenized.', kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 }),
  P('eggs', 'Pasture-Raised Eggs', 'dairy', 5.99, '12 ct', 'eggs', { cut: true, badges: ['Organic'], rating: 4.9, reviews: 707, origin: 'Amish Country, PA', desc: 'Deep orange yolks from hens that roam outdoors.', kcal: 143, protein: 13, carbs: 0.7, fat: 9.5 }),
  P('cheese', 'Aged White Cheddar', 'dairy', 6.49, '8 oz', 'cheese', { rating: 4.8, reviews: 244, origin: 'Vermont', desc: 'Aged 12 months: sharp, nutty and crumbly.', kcal: 403, protein: 25, carbs: 1.3, fat: 33 }),
  P('butter', 'Salted Butter', 'dairy', 4.49, '8 oz', 'butter', { rating: 4.7, reviews: 188, origin: 'Ireland', desc: 'Golden, creamy and churned slowly.', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 }),
  P('yogurt', 'Greek Yogurt', 'dairy', 4.99, '32 oz', 'yogurt', { old: 5.99, badges: ['Sale'], rating: 4.6, reviews: 316, origin: 'Upstate NY', desc: 'Thick, tangy and high in protein.', kcal: 97, protein: 9, carbs: 3.6, fat: 5 }),
  // ---------------- bakery ----------------
  P('bread', 'Whole Wheat Loaf', 'bakery', 4.99, 'each', 'bread', { badges: ['Fresh today'], rating: 4.8, reviews: 267, origin: 'Freshly Bakehouse', desc: 'Slow-fermented, nutty and soft inside.', kcal: 247, protein: 13, carbs: 41, fat: 3.4 }),
  P('croissant', 'Butter Croissants', 'bakery', 6.99, '4 ct', 'croissant', { cut: true, badges: ['Fresh today'], rating: 4.9, reviews: 448, origin: 'Freshly Bakehouse', desc: 'Flaky, golden layers with French butter.', kcal: 406, protein: 8.2, carbs: 45, fat: 21 }),
  P('bagel', 'New York Plain Bagels', 'bakery', 5.49, '6 ct', 'bagel', { cut: true, rating: 4.7, reviews: 390, origin: 'Freshly Bakehouse', desc: 'Kettle-boiled for that chewy New York bite.', kcal: 250, protein: 10, carbs: 49, fat: 1.5 }),
  P('baguette', 'French Baguette', 'bakery', 2.99, 'each', 'baguette', { badges: ['Fresh today'], rating: 4.8, reviews: 211, origin: 'Freshly Bakehouse', desc: 'Crackly crust, airy crumb. Baked every 2 hours.', kcal: 270, protein: 9, carbs: 55, fat: 1.2 }),
  P('muffin', 'Blueberry Muffins', 'bakery', 5.99, '4 ct', 'muffin', { cut: true, rating: 4.6, reviews: 172, origin: 'Freshly Bakehouse', desc: 'Bursting with wild blueberries and a sugar crust.', kcal: 377, protein: 5, carbs: 54, fat: 16 }),
  // ---------------- meat & seafood ----------------
  P('chicken', 'Whole Free-Range Chicken', 'meat', 11.99, '≈4 lb', 'chicken', { badges: ['Organic'], rating: 4.7, reviews: 158, origin: 'Pennsylvania', desc: 'Air-chilled, free-range and ready to roast.', kcal: 215, protein: 18, carbs: 0, fat: 15 }),
  P('salmon', 'Atlantic Salmon Fillet', 'meat', 12.99, '1 lb', 'salmon', { old: 15.99, badges: ['Sale'], rating: 4.8, reviews: 301, origin: 'Faroe Islands', desc: 'Rich, buttery fillets cut fresh at our counter.', kcal: 208, protein: 20, carbs: 0, fat: 13 }),
  P('steak', 'Ribeye Steak', 'meat', 18.99, '1 lb', 'steak', { rating: 4.9, reviews: 222, origin: 'Nebraska', desc: 'Beautifully marbled, dry-aged 21 days.', kcal: 291, protein: 24, carbs: 0, fat: 22 }),
  P('shrimp', 'Wild Gulf Shrimp', 'meat', 13.99, '1 lb', 'shrimp', { rating: 4.6, reviews: 119, origin: 'Gulf of Mexico', desc: 'Peeled and deveined, sweet and firm.', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 }),
  // ---------------- pantry ----------------
  P('pasta', 'Bronze-Cut Penne', 'pantry', 2.49, '1 lb', 'pasta', { rating: 4.7, reviews: 263, origin: 'Gragnano, Italy', desc: 'Rough texture that holds every drop of sauce.', kcal: 371, protein: 13, carbs: 75, fat: 1.5 }),
  P('rice', 'Brown Basmati Rice', 'pantry', 4.49, '2 lb', 'rice', { cut: true, rating: 4.6, reviews: 142, origin: 'Punjab, India', desc: 'Long, fragrant grains with a nutty bite.', kcal: 362, protein: 7.5, carbs: 76, fat: 2.7 }),
  P('oliveoil', 'Extra Virgin Olive Oil', 'pantry', 11.99, '500 ml', 'oliveoil', { rating: 4.8, reviews: 377, origin: 'Crete, Greece', desc: 'Cold-pressed, peppery and bright green.', kcal: 884, protein: 0, carbs: 0, fat: 100 }),
  P('honey', 'Raw Wildflower Honey', 'pantry', 8.99, '12 oz', 'honey', { rating: 4.9, reviews: 204, origin: 'Catskills, NY', desc: 'Unfiltered and floral, from local hives.', kcal: 304, protein: 0.3, carbs: 82, fat: 0 }),
  P('coffee', 'Single-Origin Coffee Beans', 'pantry', 13.99, '12 oz', 'coffee', { cut: true, rating: 4.8, reviews: 431, origin: 'Huila, Colombia', desc: 'Notes of caramel, cherry and cocoa. Roasted weekly.', kcal: 2, protein: 0.1, carbs: 0, fat: 0 }),
  P('cereal', 'Honey Oat Granola', 'pantry', 5.99, '12 oz', 'cereal', { rating: 4.5, reviews: 150, origin: 'Freshly Kitchen', desc: 'Toasted oats, almonds and a drizzle of honey.', kcal: 471, protein: 10, carbs: 64, fat: 20 }),
  // ---------------- snacks ----------------
  P('chocolate', '70% Dark Chocolate', 'snacks', 3.99, '3.5 oz', 'chocolate', { cut: true, rating: 4.8, reviews: 298, origin: 'Ecuador cacao', desc: 'Smooth, fruity and not too bitter.', kcal: 598, protein: 7.8, carbs: 46, fat: 43 }),
  P('nuts', 'Roasted Almonds', 'snacks', 7.49, '12 oz', 'nuts', { cut: true, old: 8.99, badges: ['Sale'], rating: 4.7, reviews: 186, origin: 'California', desc: 'Dry-roasted with a pinch of sea salt.', kcal: 579, protein: 21, carbs: 22, fat: 50 }),
  P('cookies', 'Sugar Star Cookies', 'snacks', 5.49, '10 ct', 'cookies', { badges: ['Fresh today'], rating: 4.6, reviews: 93, origin: 'Freshly Bakehouse', desc: 'Buttery shortbread stars with vanilla icing.', kcal: 480, protein: 5, carbs: 66, fat: 22 }),
  P('chips', 'Kettle Potato Chips', 'snacks', 3.49, '8 oz', 'chips', { rating: 4.5, reviews: 207, origin: 'Pennsylvania', desc: 'Thick-cut and extra crunchy.', kcal: 536, protein: 7, carbs: 53, fat: 35 }),
  // ---------------- drinks ----------------
  P('juice', 'Fresh-Squeezed Orange Juice', 'drinks', 5.99, '52 oz', 'juice', { badges: ['Fresh today'], rating: 4.8, reviews: 355, origin: 'Florida', desc: 'Never from concentrate, squeezed this morning.', kcal: 45, protein: 0.7, carbs: 10, fat: 0.2 }),
  P('lemonade', 'Blood Orange Lemonade', 'drinks', 4.49, '32 oz', 'lemonade', { rating: 4.6, reviews: 118, origin: 'Freshly Kitchen', desc: 'Tart, sweet and gorgeously pink.', kcal: 40, protein: 0, carbs: 10, fat: 0 }),
  P('water', 'Sparkling Mint Water', 'drinks', 1.99, '1 L', 'water', { rating: 4.4, reviews: 76, origin: 'Vermont springs', desc: 'Lightly sparkling with a hint of mint.', kcal: 0, protein: 0, carbs: 0, fat: 0 }),
  P('tea', 'Earl Grey Loose-Leaf Tea', 'drinks', 7.99, '4 oz', 'tea', { rating: 4.7, reviews: 133, origin: 'Assam & Calabria', desc: 'Black tea with real bergamot oil.', kcal: 1, protein: 0, carbs: 0.3, fat: 0 }),
];

export const DEALS = [
  { id: 'strawberries', label: 'Berry season', off: 25 },
  { id: 'salmon', label: 'Fish Friday', off: 19 },
  { id: 'peppers', label: 'Grill ready', off: 17 },
  { id: 'nuts', label: 'Snack drawer', off: 17 },
  { id: 'mango', label: 'Tropical week', off: 25 },
  { id: 'yogurt', label: 'Breakfast club', off: 17 },
];

export const BUNDLES = [
  { id: 'breakfast', name: 'Sunday Breakfast Box', items: ['eggs', 'bread', 'butter', 'juice', 'coffee'], save: 4, img: 's/breakfast' },
  { id: 'bbq', name: 'Backyard BBQ Kit', items: ['steak', 'peppers', 'corn', 'onions', 'lemonade'], save: 6, img: 's/bbq' },
];

export const RECIPE = {
  title: 'Sunny Summer Salad',
  time: '15 min',
  serves: 2,
  kcal: 380,
  img: 's/salad',
  items: [
    { id: 'lettuce', qty: 1, note: '1 romaine heart' },
    { id: 'tomatoes', qty: 1, note: '2 vine tomatoes' },
    { id: 'cucumber', qty: 1, note: '½ cucumber' },
    { id: 'avocados', qty: 1, note: '1 ripe avocado' },
    { id: 'lemons', qty: 1, note: 'juice of 1 lemon' },
    { id: 'oliveoil', qty: 1, note: '2 tbsp olive oil' },
    { id: 'cheese', qty: 1, note: 'shaved cheddar' },
  ],
  steps: ['Chop the romaine, tomatoes and cucumber into bite-size pieces.', 'Slice the avocado and fan it over the greens.', 'Whisk lemon juice, olive oil, salt and pepper.', 'Dress, toss gently and finish with shaved cheddar.'],
};

export const REVIEWS = [
  { name: 'Priya S.', city: 'Brooklyn', text: 'The strawberries actually taste like strawberries. Delivery came in 24 minutes, still cold.', stars: 5 },
  { name: 'Marcus L.', city: 'Hoboken', text: 'Best croissants I’ve had outside Paris. The bakery section is dangerous for my wallet.', stars: 5 },
  { name: 'Elena R.', city: 'Queens', text: 'Love the recipe of the day, one click and everything is in my cart. Dinner sorted.', stars: 5 },
  { name: 'Tom W.', city: 'Jersey City', text: 'Produce is always perfect and they substitute smartly when something is out.', stars: 4 },
  { name: 'Aisha K.', city: 'Manhattan', text: 'Free delivery over $35 and the salmon is restaurant quality. Weekly order for me now.', stars: 5 },
  { name: 'Daniel P.', city: 'Bronx', text: 'The app-free website is so fast. Add to cart animation makes me smile every time.', stars: 5 },
];

export const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// ---------------- growers (farmer profiles) ----------------
export const FARMS = [
  { id: 'brennan', name: 'Brennan Family Orchards', farmer: 'Colleen Brennan', place: 'Hudson Valley, NY', miles: 90, since: 1962, acres: 140, img: 'p/apples', products: ['apples'], practices: ['Low-spray', 'Pollinator hedges', 'Hand-picked'], quote: 'An apple should snap when you bite it. If it bends, it isn’t ours.', story: 'Three generations of Brennans have worked the same hillside above the Hudson. Colleen took over from her father in 2009 and replanted half the orchard with Honeycrisp, which she still picks by hand at dawn so the fruit stays cold and crisp on the way to you.' },
  { id: 'stoltzfus', name: 'Stoltzfus Greenhouse', farmer: 'Eli Stoltzfus', place: 'Lancaster, PA', miles: 150, since: 1988, acres: 12, img: 'p/tomatoes', products: ['tomatoes', 'cucumber', 'lettuce'], practices: ['Rain-water irrigation', 'No pesticides', 'Vine-ripened'], quote: 'We let the vine decide when the tomato is ready.', story: 'Eli’s glasshouses run on collected rain water and a wood-chip boiler. Tomatoes ripen fully on the vine, then travel in padded crates so they arrive the way they left the plant.' },
  { id: 'meadowhen', name: 'Meadow Hen Farm', farmer: 'Ruth & Amos King', place: 'Amish Country, PA', miles: 160, since: 1995, acres: 60, img: 'p/eggs', products: ['eggs'], practices: ['Pasture-raised', '108 sq ft per hen', 'Mobile coops'], quote: 'Happy hens lay the orange yolks. It really is that simple.', story: 'The Kings move their coops across the pasture every few days so the hens always have fresh grass, bugs and sunshine. The result is a deep orange yolk that chefs across the city ask for by name.' },
  { id: 'pinebarrens', name: 'Pine Barrens Berry Farm', farmer: 'Marisol Vega', place: 'Hammonton, NJ', miles: 60, since: 2004, acres: 85, img: 'p/blueberries', products: ['blueberries', 'corn'], practices: ['Certified organic', 'Drip irrigation', 'Cover crops'], quote: 'Blueberries were born in these sandy soils. We just look after them.', story: 'Hammonton calls itself the blueberry capital of the world, and Marisol’s bushes are some of the oldest in town. In late summer the same fields give us the sweet corn in our BBQ kit.' },
  { id: 'greenhollow', name: 'Green Hollow Dairy', farmer: 'The Lambert family', place: 'Vermont', miles: 190, since: 1931, acres: 320, img: 'p/cheese', products: ['milk', 'cheese', 'butter'], practices: ['Grass-fed', 'Small herd', 'Cave-aged cheese'], quote: 'Grass in, flavour out.', story: 'Forty-two Jersey cows graze rolling Vermont pasture from April to November. Their milk is bottled on the farm, and the best of it becomes a 12-month cheddar aged in a stone cave dug into the hill.' },
  { id: 'kennett', name: 'Kennett Mushroom Co.', farmer: 'Daniel Okafor', place: 'Kennett Square, PA', miles: 120, since: 2011, acres: 4, img: 'p/mushrooms', products: ['mushrooms'], practices: ['Compost-grown', 'Zero waste', 'Harvested daily'], quote: 'Mushrooms grow overnight, so we harvest every single morning.', story: 'Kennett Square grows more than half of America’s mushrooms. Daniel’s small farm focuses on specialty varieties grown on recycled straw and coffee grounds, then turns the spent compost into soil for local gardens.' },
  { id: 'catskill', name: 'Catskill Bee Collective', farmer: 'June Harrow', place: 'Catskills, NY', miles: 110, since: 2015, acres: 30, img: 'p/honey', products: ['honey'], practices: ['Raw & unfiltered', 'Wildflower meadows', 'Treatment-free'], quote: 'Every jar tastes a little different, because every week the flowers change.', story: 'June keeps 90 hives scattered through wildflower meadows in the Catskill mountains. The honey is never heated or filtered, so it keeps the pollen, the aroma and the taste of the season.' },
  { id: 'rootrow', name: 'Root & Row Farm', farmer: 'Sam & Priya Patel', place: 'Upstate NY', miles: 170, since: 2017, acres: 25, img: 'p/carrots', products: ['carrots', 'potatoes', 'onions'], practices: ['Regenerative', 'No-till beds', 'Solar-powered cooling'], quote: 'Healthy soil grows sweeter roots.', story: 'Sam and Priya left city jobs to farm with regenerative methods: no-till beds, compost and cover crops. Their carrots are harvested after the first frost, when the cold turns their starch into sugar.' },
];

// ---------------- meal planner ----------------
export const MEALS = [
  { id: 'salad', name: 'Sunny Summer Salad', img: 's/salad', kcal: 380, time: '15 min', items: [['lettuce', 1], ['tomatoes', 1], ['cucumber', 1], ['avocados', 1], ['lemons', 1], ['oliveoil', 1], ['cheese', 1]] },
  { id: 'salmon', name: 'Lemon Salmon & Greens', img: 'p/salmon', kcal: 520, time: '25 min', items: [['salmon', 1], ['spinach', 1], ['lemons', 1], ['potatoes', 1], ['garlic', 1]] },
  { id: 'steak', name: 'Steak Night', img: 'p/steak', kcal: 780, time: '30 min', items: [['steak', 1], ['potatoes', 1], ['mushrooms', 1], ['butter', 1], ['garlic', 1]] },
  { id: 'pasta', name: 'Pasta Primavera', img: 'p/pasta', kcal: 610, time: '20 min', items: [['pasta', 1], ['tomatoes', 1], ['peppers', 1], ['garlic', 1], ['oliveoil', 1], ['cheese', 1]] },
  { id: 'chicken', name: 'Sunday Roast Chicken', img: 'p/chicken', kcal: 690, time: '90 min', items: [['chicken', 1], ['potatoes', 1], ['carrots', 1], ['onions', 1], ['lemons', 1], ['garlic', 1]] },
  { id: 'shrimp', name: 'Garlic Shrimp Stir-fry', img: 'p/shrimp', kcal: 540, time: '20 min', items: [['shrimp', 1], ['rice', 1], ['peppers', 1], ['broccoli', 1], ['garlic', 1]] },
  { id: 'risotto', name: 'Mushroom Risotto', img: 'p/mushrooms', kcal: 590, time: '40 min', items: [['rice', 1], ['mushrooms', 1], ['onions', 1], ['cheese', 1], ['butter', 1]] },
  { id: 'brunch', name: 'Breakfast for Dinner', img: 's/breakfast', kcal: 560, time: '15 min', items: [['eggs', 1], ['bread', 1], ['butter', 1], ['avocados', 1], ['juice', 1]] },
];

// ---------------- smoothie builder ----------------
// colour is the flesh / juice colour used to mix the drink; tag names the smoothie
export const BLEND = {
  strawberries: { color: '#e8394a', tag: 'Berry', kcal: 50, vitC: 90 },
  bananas: { color: '#f3dd8a', tag: 'Creamy', kcal: 105, vitC: 15 },
  blueberries: { color: '#5a3f99', tag: 'Blue', kcal: 60, vitC: 20 },
  mango: { color: '#ffb02e', tag: 'Tropical', kcal: 100, vitC: 70 },
  pineapple: { color: '#f7d33c', tag: 'Island', kcal: 80, vitC: 95 },
  kiwi: { color: '#86c13d', tag: 'Green', kcal: 45, vitC: 110 },
  oranges: { color: '#ff9616', tag: 'Sunrise', kcal: 60, vitC: 100 },
  apples: { color: '#f1dca0', tag: 'Orchard', kcal: 70, vitC: 10 },
  avocados: { color: '#a3c96b', tag: 'Velvet', kcal: 120, vitC: 12 },
  lemons: { color: '#fff06a', tag: 'Zesty', kcal: 15, vitC: 60 },
};

// ---------------- seasons ----------------
export const SEASONS = {
  spring: { name: 'Spring', icon: '🌸', line: 'Spring greens are in', picks: ['strawberries', 'lettuce', 'spinach', 'cucumber', 'kiwi', 'eggs'] },
  summer: { name: 'Summer', icon: '☀️', line: 'Summer fruit is at its peak', picks: ['watermelon', 'blueberries', 'corn', 'tomatoes', 'peppers', 'lemonade'] },
  autumn: { name: 'Autumn', icon: '🍂', line: 'Autumn harvest is here', picks: ['apples', 'grapes', 'potatoes', 'mushrooms', 'carrots', 'onions'] },
  winter: { name: 'Winter', icon: '❄️', line: 'Winter warmers are in', picks: ['oranges', 'lemons', 'potatoes', 'tea', 'chocolate', 'coffee'] },
};

// ---------------- daily prize wheel ----------------
export const PRIZES = [
  { label: '10% off', short: '10%', type: 'pct', value: 10, color: '#2e9e5b', weight: 20 },
  { label: 'Free delivery', short: 'Free\ndelivery', type: 'ship', value: 0, color: '#ffc94a', weight: 18 },
  { label: '$5 off', short: '$5', type: 'amt', value: 5, color: '#e8453c', weight: 12 },
  { label: 'Free croissants', short: 'Free\ncroissants', type: 'item', id: 'croissant', color: '#ff8a3d', weight: 10 },
  { label: '15% off', short: '15%', type: 'pct', value: 15, color: '#1f7a4d', weight: 10 },
  { label: '$3 off', short: '$3', type: 'amt', value: 3, color: '#f7b2a4', weight: 16 },
  { label: 'Free bananas', short: 'Free\nbananas', type: 'item', id: 'bananas', color: '#f3dd8a', weight: 10 },
  { label: '20% off', short: '20%', type: 'pct', value: 20, color: '#8a5cc2', weight: 4 },
];

// names for the (clearly demo) live activity popups
export const SHOPPERS = [['Maya', 'Astoria'], ['Luis', 'Harlem'], ['Grace', 'Park Slope'], ['Omar', 'Hoboken'], ['Hannah', 'Williamsburg'], ['Kenji', 'Long Island City'], ['Zoe', 'Upper West Side'], ['Andre', 'Bed-Stuy'], ['Fatima', 'Jersey City'], ['Leo', 'Greenpoint'], ['Sofia', 'Chelsea'], ['Ben', 'Forest Hills']];
