/**
 * Smart Image Matcher - Maps menu item names to relevant Unsplash images
 * Returns a precise image URL based on keywords in the item name and category
 */

// Unsplash image IDs for specific food/drink items
const UNSPLASH_IMAGES = {
    // Beverages - Sodas
    cola: 'photo-1554866585-cd94860890b7', // Coca-Cola
    fanta: 'photo-1625772452859-1c03d5bf1137', // Orange soda
    sprite: 'photo-1629203851122-3726ecdf080e', // Lemon soda
    water: 'photo-1548839140-29a749e1cf4d', // Bottled water

    // Beverages - Hot drinks
    coffee: 'photo-1509042239860-f550ce710b93', // Coffee cup
    tea: 'photo-1564890369478-c89ca6d9cde9', // Tea
    espresso: 'photo-1510591509098-f4fdc6d0ff04', // Espresso

    // Beverages - Alcohol
    beer: 'photo-1608270586620-248524c67de9', // Beer
    wine: 'photo-1510812431401-41d2bd2722f3', // Wine glass
    cocktail: 'photo-1514362545857-3bc16c4c7d1b', // Cocktail
    whisky: 'photo-1527281400683-1aae777175f8', // Whisky
    champagne: 'photo-1547595628-c61a29f496f0', // Champagne

    // Beverages - Juices
    juice: 'photo-1600271886742-f049cd451bba', // Fresh juice
    smoothie: 'photo-1505252585461-04db1eb84625', // Smoothie

    // Food - Fast food
    burger: 'photo-1568901346375-23c9450c58cd', // Burger
    pizza: 'photo-1513104890138-7c749659a591', // Pizza
    sandwich: 'photo-1528735602780-2552fd46c7af', // Sandwich
    hotdog: 'photo-1612392062798-2dbae2d4d7f9', // Hot dog
    fries: 'photo-1576107232684-1279f390859f', // French fries

    // Food - Main dishes
    chicken: 'photo-1598103442097-8b74394b95c6', // Grilled chicken
    steak: 'photo-1600891964092-4316c288032e', // Steak
    fish: 'photo-1519708227418-c8fd9a32b7a2', // Grilled fish
    pasta: 'photo-1621996346565-e3dbc646d9a9', // Pasta
    rice: 'photo-1516684732162-798a0062be99', // Rice dish

    // Food - Starters & Sides
    salad: 'photo-1512621776951-a57141f2eefd', // Fresh salad
    soup: 'photo-1547592166-23ac45744acd', // Soup
    nachos: 'photo-1513456852971-30c0b8199d4d', // Nachos
    wings: 'photo-1527477396000-e27163b481c2', // Chicken wings

    // Food - Desserts
    cake: 'photo-1578985545062-69928b1d9587', // Cake
    icecream: 'photo-1563805042-7684c019e1cb', // Ice cream
    brownie: 'photo-1606313564200-e75d5e30476c', // Brownie
    cheesecake: 'photo-1533134486753-c833f0ed4866', // Cheesecake

    // Breakfast
    breakfast: 'photo-1533089860892-a7c6f0a88666', // Breakfast plate
    pancake: 'photo-1567620905732-2d1ec7ab7445', // Pancakes
    waffle: 'photo-1562376552-0d160a2f238d', // Waffles
    omelette: 'photo-1608039829572-78524f79c4c7', // Omelette

    // Generic fallbacks
    food: 'photo-1546069901-ba9599a7e63c', // Generic food
    drink: 'photo-1437418747212-8d9709afab22', // Generic drink
    dessert: 'photo-1488477181946-6428a0291777', // Generic dessert
};

/**
 * Get smart image URL based on item name and category
 */
export function getSmartImage(itemName: string, category: string = '', description: string = ''): string {
    const searchText = `${itemName} ${category} ${description}`.toLowerCase();

    // Beverages - Sodas & Soft drinks (with word boundaries to avoid false matches)
    if (searchText.match(/\bcoca\b|\bcoke\b|\bcola\b(?!da)/)) return buildUnsplashUrl(UNSPLASH_IMAGES.cola, 'coca cola');
    if (searchText.match(/\bfanta\b/)) return buildUnsplashUrl(UNSPLASH_IMAGES.fanta, 'fanta orange');
    if (searchText.match(/\bsprite\b/)) return buildUnsplashUrl(UNSPLASH_IMAGES.sprite, 'sprite lemon');
    if (searchText.match(/red.?bull/)) return buildUnsplashUrl('photo-1622543925917-763c34f1f86a', 'red bull energy drink');
    if (searchText.match(/\beau\b|water|mineral|evian|perrier/)) return buildUnsplashUrl(UNSPLASH_IMAGES.water, 'water bottle');

    // Beverages - Hot drinks
    if (searchText.match(/café|coffee|cappuccino|latte/)) return buildUnsplashUrl(UNSPLASH_IMAGES.coffee, 'coffee');
    if (searchText.match(/espresso|expresso/)) return buildUnsplashUrl(UNSPLASH_IMAGES.espresso, 'espresso');
    if (searchText.match(/\bthé\b|tea|infusion/)) return buildUnsplashUrl(UNSPLASH_IMAGES.tea, 'tea');

    // Beverages - Alcohol - Cocktails (specific cocktails first)
    if (searchText.match(/mojito/)) return buildUnsplashUrl('photo-1551024601-bec78aea704b', 'mojito cocktail');
    if (searchText.match(/margarita/)) return buildUnsplashUrl('photo-1609951651556-5334e2706168', 'margarita cocktail');
    if (searchText.match(/pina.?colada/)) return buildUnsplashUrl('photo-1536935338788-846bb9981813', 'pina colada');
    if (searchText.match(/daiquiri/)) return buildUnsplashUrl('photo-1470337458703-46ad1756a187', 'daiquiri');
    if (searchText.match(/cosmopolitan/)) return buildUnsplashUrl('photo-1514362545857-3bc16c4c7d1b', 'cosmopolitan');
    if (searchText.match(/cocktail/)) return buildUnsplashUrl(UNSPLASH_IMAGES.cocktail, 'cocktail');

    // Beverages - Alcohol - Beer & Wine
    if (searchText.match(/bière|beer|pression|heineken|guinness/)) return buildUnsplashUrl(UNSPLASH_IMAGES.beer, 'beer');
    if (searchText.match(/\bvin\b|wine|rouge|blanc|rosé/)) return buildUnsplashUrl(UNSPLASH_IMAGES.wine, 'wine');
    if (searchText.match(/champagne|prosecco|sparkling/)) return buildUnsplashUrl(UNSPLASH_IMAGES.champagne, 'champagne');

    // Beverages - Alcohol - Spirits & Liqueurs
    if (searchText.match(/whisky|whiskey|bourbon|scotch/)) return buildUnsplashUrl(UNSPLASH_IMAGES.whisky, 'whisky');
    if (searchText.match(/vodka/)) return buildUnsplashUrl('photo-1560508801-e1d1e8f8f1e5', 'vodka bottle');
    if (searchText.match(/\bgin\b/)) return buildUnsplashUrl('photo-1551538827-9c037cb4f32a', 'gin bottle');
    if (searchText.match(/rhum|rum/)) return buildUnsplashUrl('photo-1514362545857-3bc16c4c7d1b', 'rum bottle');
    if (searchText.match(/tequila/)) return buildUnsplashUrl('photo-1582037928769-181f2644ecb7', 'tequila bottle');
    if (searchText.match(/cognac|hennessy|remy/)) return buildUnsplashUrl('photo-1569529465841-dfecdab7503b', 'cognac bottle');
    if (searchText.match(/baileys|liqueur|amaretto/)) return buildUnsplashUrl('photo-1470337458703-46ad1756a187', 'liqueur bottle');

    // Beverages - Juices & Smoothies
    if (searchText.match(/\bjus\b|juice|fresh|pressé|orange juice|apple juice/)) return buildUnsplashUrl(UNSPLASH_IMAGES.juice, 'fresh juice');
    if (searchText.match(/smoothie|milkshake/)) return buildUnsplashUrl(UNSPLASH_IMAGES.smoothie, 'smoothie');

    // Food - Fast food
    if (searchText.match(/burger|hamburger/)) return buildUnsplashUrl(UNSPLASH_IMAGES.burger, 'burger');
    if (searchText.match(/pizza/)) return buildUnsplashUrl(UNSPLASH_IMAGES.pizza, 'pizza');
    if (searchText.match(/sandwich|panini/)) return buildUnsplashUrl(UNSPLASH_IMAGES.sandwich, 'sandwich');
    if (searchText.match(/hot.?dog/)) return buildUnsplashUrl(UNSPLASH_IMAGES.hotdog, 'hotdog');
    if (searchText.match(/frites|fries|chips/)) return buildUnsplashUrl(UNSPLASH_IMAGES.fries, 'french fries');

    // Food - Main dishes
    if (searchText.match(/poulet|chicken|ailes?/)) return buildUnsplashUrl(UNSPLASH_IMAGES.chicken, 'grilled chicken');
    if (searchText.match(/steak|boeuf|beef|viande/)) return buildUnsplashUrl(UNSPLASH_IMAGES.steak, 'steak');
    if (searchText.match(/poisson|fish|saumon|salmon/)) return buildUnsplashUrl(UNSPLASH_IMAGES.fish, 'grilled fish');
    if (searchText.match(/pâtes|pasta|spaghetti|linguine/)) return buildUnsplashUrl(UNSPLASH_IMAGES.pasta, 'pasta');
    if (searchText.match(/\briz\b|rice|risotto/)) return buildUnsplashUrl(UNSPLASH_IMAGES.rice, 'rice dish');

    // Food - Starters & Sides
    if (searchText.match(/salade|salad/)) return buildUnsplashUrl(UNSPLASH_IMAGES.salad, 'fresh salad');
    if (searchText.match(/soupe|soup|potage/)) return buildUnsplashUrl(UNSPLASH_IMAGES.soup, 'soup');
    if (searchText.match(/nachos/)) return buildUnsplashUrl(UNSPLASH_IMAGES.nachos, 'nachos');
    if (searchText.match(/wings|ailes/)) return buildUnsplashUrl(UNSPLASH_IMAGES.wings, 'chicken wings');

    // Food - Desserts
    if (searchText.match(/gâteau|cake|torte/)) return buildUnsplashUrl(UNSPLASH_IMAGES.cake, 'cake');
    if (searchText.match(/glace|ice.?cream|gelato/)) return buildUnsplashUrl(UNSPLASH_IMAGES.icecream, 'ice cream');
    if (searchText.match(/brownie/)) return buildUnsplashUrl(UNSPLASH_IMAGES.brownie, 'brownie');
    if (searchText.match(/cheesecake/)) return buildUnsplashUrl(UNSPLASH_IMAGES.cheesecake, 'cheesecake');

    // Breakfast
    if (searchText.match(/petit.?déjeuner|breakfast/)) return buildUnsplashUrl(UNSPLASH_IMAGES.breakfast, 'breakfast');
    if (searchText.match(/pancake|crêpe/)) return buildUnsplashUrl(UNSPLASH_IMAGES.pancake, 'pancakes');
    if (searchText.match(/waffle|gaufre/)) return buildUnsplashUrl(UNSPLASH_IMAGES.waffle, 'waffles');
    if (searchText.match(/omelette/)) return buildUnsplashUrl(UNSPLASH_IMAGES.omelette, 'omelette');

    // Category-based fallbacks
    const categoryLower = category.toLowerCase();
    if (categoryLower.match(/boisson|drink|beverage/)) return buildUnsplashUrl(UNSPLASH_IMAGES.drink, 'refreshing drink');
    if (categoryLower.match(/dessert|sucré|sweet/)) return buildUnsplashUrl(UNSPLASH_IMAGES.dessert, 'dessert');
    if (categoryLower.match(/cocktail/)) return buildUnsplashUrl(UNSPLASH_IMAGES.cocktail, 'cocktail');
    if (categoryLower.match(/entrée|starter/)) return buildUnsplashUrl(UNSPLASH_IMAGES.salad, 'starter');
    if (categoryLower.match(/alcool|spirit|liqueur/)) return buildUnsplashUrl('photo-1569529465841-dfecdab7503b', 'spirits bar');

    // Ultimate fallback
    return buildUnsplashUrl(UNSPLASH_IMAGES.food, 'gourmet food');
}

/**
 * Build Unsplash URL with proper parameters
 */
function buildUnsplashUrl(photoId: string, keyword: string): string {
    return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=80&w=400&keyword=${encodeURIComponent(keyword)}`;
}
