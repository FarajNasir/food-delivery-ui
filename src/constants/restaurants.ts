import { Restaurant } from "@/types";

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "The Pizza Palace",
    location: "123 Main Street, Newcastle",
    opening: "10:00 AM",
    closing: "11:00 PM",
    menu: [
      { id: "1", name: "Margherita Pizza", price: 12.99, description: "Classic cheese and tomato" },
      { id: "2", name: "Pepperoni Pizza", price: 14.99, description: "With fresh pepperoni" },
      { id: "3", name: "Vegetarian Pizza", price: 13.99, description: "Fresh vegetables" },
      { id: "4", name: "Garlic Bread", price: 5.99, description: "Crispy and golden" },
      { id: "5", name: "Caesar Salad", price: 8.99, description: "With homemade dressing" },
    ],
  },

  {
    id: "2",
    name: "Burger Express",
    location: "456 King Road, Newcastle",
    opening: "11:00 AM",
    closing: "10:00 PM",
    menu: [
      { id: "1", name: "Classic Burger", price: 9.99, description: "Beef patty with all the trimmings" },
      { id: "2", name: "Double Cheeseburger", price: 12.99, description: "Two patties, double cheese" },
      { id: "3", name: "Chicken Burger", price: 10.99, description: "Crispy fried chicken" },
      { id: "4", name: "French Fries", price: 4.99, description: "Golden and crispy" },
      { id: "5", name: "Milkshake", price: 5.99, description: "Vanilla, chocolate, or strawberry" },
    ],
  },

  {
    id: "3",
    name: "Sushi Master",
    location: "789 Queen Street, Newcastle",
    opening: "12:00 PM",
    closing: "10:30 PM",
    menu: [
      { id: "1", name: "California Roll", price: 10.99, description: "Crab, avocado, cucumber" },
      { id: "2", name: "Spicy Tuna Roll", price: 11.99, description: "Tuna with spicy mayo" },
      { id: "3", name: "Salmon Sushi", price: 12.99, description: "Fresh Atlantic salmon" },
      { id: "4", name: "Miso Soup", price: 4.99, description: "Traditional soy broth" },
      { id: "5", name: "Edamame", price: 5.99, description: "Steamed soybeans with salt" },
    ],
  },

  {
    id: "4",
    name: "The Curry House",
    location: "321 Princess Street, Newcastle",
    opening: "5:00 PM",
    closing: "11:00 PM",
    menu: [
      { id: "1", name: "Chicken Tikka Masala", price: 13.99, description: "Creamy tomato sauce" },
      { id: "2", name: "Lamb Biryani", price: 14.99, description: "Fragrant basmati rice" },
      { id: "3", name: "Vegetable Curry", price: 11.99, description: "Mixed vegetables in sauce" },
      { id: "4", name: "Naan Bread", price: 3.99, description: "Freshly baked flatbread" },
      { id: "5", name: "Samosa", price: 4.99, description: "Crispy pastry pockets" },
    ],
  },

  {
    id: "5",
    name: "Veggie Delight",
    location: "555 Northumberland Street, Newcastle",
    opening: "9:00 AM",
    closing: "9:00 PM",
    menu: [
      { id: "1", name: "Buddha Bowl", price: 11.99, description: "Quinoa, veggies, tahini dressing" },
      { id: "2", name: "Vegan Burger", price: 10.99, description: "Plant-based patty" },
      { id: "3", name: "Acai Bowl", price: 9.99, description: "With granola and berries" },
      { id: "4", name: "Green Juice", price: 6.99, description: "Apple, celery, ginger" },
      { id: "5", name: "Falafel Wrap", price: 8.99, description: "Chickpea falafel with tahini" },
    ],
  },

  {
    id: "6",
    name: "London Steakhouse",
    location: "22 Oxford Street, London",
    opening: "1:00 PM",
    closing: "11:30 PM",
    menu: [
      { id: "1", name: "Ribeye Steak", price: 24.99, description: "Grilled ribeye with herbs" },
      { id: "2", name: "Sirloin Steak", price: 22.99, description: "Tender sirloin cut" },
      { id: "3", name: "Steak Sandwich", price: 15.99, description: "Steak with caramelized onions" },
      { id: "4", name: "Mashed Potatoes", price: 6.99, description: "Creamy butter mash" },
      { id: "5", name: "House Salad", price: 7.99, description: "Fresh greens with vinaigrette" },
    ],
  },

  {
    id: "7",
    name: "NYC Deli",
    location: "120 Broadway, New York",
    opening: "8:00 AM",
    closing: "9:00 PM",
    menu: [
      { id: "1", name: "Pastrami Sandwich", price: 13.99, description: "Classic NYC pastrami" },
      { id: "2", name: "Bagel with Cream Cheese", price: 4.99, description: "Fresh baked bagel" },
      { id: "3", name: "Turkey Club", price: 12.99, description: "Turkey, bacon, lettuce, tomato" },
      { id: "4", name: "Chicken Soup", price: 6.99, description: "Homestyle chicken soup" },
      { id: "5", name: "Cheesecake", price: 7.99, description: "New York style cheesecake" },
    ],
  },

  {
    id: "8",
    name: "Tokyo Ramen Bar",
    location: "15 Shibuya Street, Tokyo",
    opening: "11:00 AM",
    closing: "11:00 PM",
    menu: [
      { id: "1", name: "Tonkotsu Ramen", price: 11.99, description: "Rich pork broth ramen" },
      { id: "2", name: "Shoyu Ramen", price: 10.99, description: "Soy sauce flavored broth" },
      { id: "3", name: "Gyoza", price: 6.99, description: "Pan-fried dumplings" },
      { id: "4", name: "Tempura", price: 8.99, description: "Lightly battered seafood" },
      { id: "5", name: "Matcha Ice Cream", price: 5.99, description: "Green tea flavored dessert" },
    ],
  },
  {
    id: "9",
    name: "Paris Café Bistro",
    location: "18 Rue Rivoli, Paris",
    opening: "7:30 AM",
    closing: "10:00 PM",
    menu: [
      { id: "1", name: "Croissant", price: 3.99, description: "Buttery French pastry" },
      { id: "2", name: "Quiche Lorraine", price: 9.99, description: "Savory egg and bacon tart" },
      { id: "3", name: "French Onion Soup", price: 8.99, description: "Classic onion soup with cheese" },
      { id: "4", name: "Crepes", price: 7.99, description: "Thin pancakes with fillings" },
      { id: "5", name: "Espresso", price: 2.99, description: "Strong Italian coffee" },
    ],
  },
];