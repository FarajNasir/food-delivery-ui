"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { restaurantService } from "@/services/api";
import { Restaurant, MenuCategory, MenuItem, Owner, RestaurantLocation } from "@/types/restaurant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Trash2, 
  Store, 
  Layers, 
  UtensilsCrossed, 
  MapPin, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

export default function AdminRestaurantsPage() {
  const { role } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form States
  const [newRestaurant, setNewRestaurant] = useState<Partial<Restaurant>>({
    name: "",
    location: "Newcastle",
    phone: "",
    email: "",
    owner_id: ""
  });
  const [newCategory, setNewCategory] = useState({ name: "", restaurant_id: "" });
  const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({
    name: "",
    price: 0,
    description: "",
    category_id: "",
    restaurant_id: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rData, cData, mData, oData] = await Promise.all([
        restaurantService.getPublicRestaurants().catch(() => []),
        restaurantService.getCategories().catch(() => []),
        restaurantService.getMenuItems().catch(() => []),
        restaurantService.getOwners().catch(() => [])
      ]);
      setRestaurants(rData as Restaurant[]);
      setCategories(cData as MenuCategory[]);
      setMenuItems(mData as MenuItem[]);
      setOwners(oData as Owner[]);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") fetchData();
  }, [role]);

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await restaurantService.createRestaurant(newRestaurant);
      setSuccess("Restaurant added successfully!");
      setNewRestaurant({ name: "", location: "Newcastle", phone: "", email: "", owner_id: "" });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await restaurantService.createCategory(newCategory.name, newCategory.restaurant_id);
      setSuccess("Category added successfully!");
      setNewCategory({ name: "", restaurant_id: "" });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...newMenuItem,
        description: newMenuItem.description || null,
        image_url: newMenuItem.image_url || null
      };
      await restaurantService.createMenuItem(payload as any);
      setSuccess("Menu item added successfully!");
      setNewMenuItem({ name: "", price: 0, description: "", image_url: "", category_id: "", restaurant_id: "" });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm("Are you sure? This will delete all associated categories and items.")) return;
    try {
      await restaurantService.deleteRestaurant(id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (role !== "admin") return <div className="p-8 text-center">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Restaurant Management</h1>
            <p className="text-slate-500 mt-2 text-lg">Configure your delivery network hierarchy.</p>
          </div>
          <Button 
            onClick={() => {
              setLoading(true);
              fetchData();
            }} 
            variant="outline" 
            className="rounded-xl h-12 px-6 font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Refresh Data"}
          </Button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-bold">{success}</p>
          </div>
        )}

        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-full md:w-auto h-auto grid grid-cols-3 md:flex gap-2">
            <TabsTrigger value="restaurants" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
              <Store className="w-4 h-4 mr-2" /> Restaurants
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
              <Layers className="w-4 h-4 mr-2" /> Categories
            </TabsTrigger>
            <TabsTrigger value="menu-items" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
              <UtensilsCrossed className="w-4 h-4 mr-2" /> Menu Items
            </TabsTrigger>
          </TabsList>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <Card className="rounded-3xl border-none shadow-xl bg-white sticky top-8">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">Add Restaurant</CardTitle>
                    <CardDescription>Register a new store in the network.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddRestaurant} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="res-name">Restaurant Name</Label>
                        <Input 
                          id="res-name" 
                          placeholder="e.g. Papa John's" 
                          value={newRestaurant.name}
                          onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                          className="rounded-xl h-12"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="res-location">Location</Label>
                        <select 
                          id="res-location"
                          className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={newRestaurant.location}
                          onChange={(e) => setNewRestaurant({...newRestaurant, location: e.target.value as RestaurantLocation})}
                        >
                          <option value="Newcastle">Newcastle</option>
                          <option value="London">London</option>
                          <option value="New York">New York</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="res-owner">Assign Owner</Label>
                        <select 
                          id="res-owner"
                          className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={newRestaurant.owner_id}
                          onChange={(e) => setNewRestaurant({...newRestaurant, owner_id: e.target.value})}
                        >
                          <option value="">Select an Owner (Optional)</option>
                          {owners.map(o => (
                            <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="res-phone">Phone</Label>
                          <Input 
                            id="res-phone" 
                            placeholder="+1 234..." 
                            value={newRestaurant.phone}
                            onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                            className="rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res-email">Email</Label>
                          <Input 
                            id="res-email" 
                            type="email"
                            placeholder="store@example.com" 
                            value={newRestaurant.email}
                            onChange={(e) => setNewRestaurant({...newRestaurant, email: e.target.value})}
                            className="rounded-xl h-12"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 h-12 rounded-xl font-bold mt-4 text-white">
                        Add Restaurant
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-8 grid md:grid-cols-2 gap-4 h-fit">
                {restaurants.map(r => (
                  <Card key={r.id} className="rounded-3xl border-none shadow-md bg-white hover:shadow-lg transition-all group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                          <Store className="w-6 h-6" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-300 hover:text-rose-600 rounded-xl"
                          onClick={() => handleDeleteRestaurant(r.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">{r.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                        <MapPin className="w-4 h-4" /> {r.location}
                      </div>
                      <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {categories.filter(c => c.restaurant_id === r.id).length} Categories
                        </div>
                        <div className="flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3" /> {menuItems.filter(m => m.restaurant_id === r.id).length} Items
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl bg-white h-fit sticky top-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-black">Add Category</CardTitle>
                  <CardDescription>Grouping items like Starters or Drinks.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat-res">Restaurant</Label>
                      <select 
                        id="cat-res"
                        className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        value={newCategory.restaurant_id}
                        onChange={(e) => setNewCategory({...newCategory, restaurant_id: e.target.value})}
                        required
                      >
                        <option value="">Select Restaurant</option>
                        {restaurants.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">Category Name</Label>
                      <Input 
                        id="cat-name" 
                        placeholder="e.g. Starters" 
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        className="rounded-xl h-12"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 h-12 rounded-xl font-bold mt-4 text-white">
                      Add Category
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                 {restaurants.map(res => (
                   <div key={res.id} className="space-y-2">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">{res.name}</h4>
                     <div className="flex flex-wrap gap-2">
                        {categories.filter(c => c.restaurant_id === res.id).map(cat => (
                          <div key={cat.id} className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
                            <span className="font-bold text-slate-700">{cat.name}</span>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="text-xs text-slate-400">{menuItems.filter(m => m.category_id === cat.id).length} items</span>
                          </div>
                        ))}
                        {categories.filter(c => c.restaurant_id === res.id).length === 0 && (
                          <p className="text-xs text-slate-400 italic px-2">No categories yet.</p>
                        )}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </TabsContent>

          {/* Menu Items Tab */}
          <TabsContent value="menu-items" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl bg-white h-fit sticky top-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-black">Add Menu Item</CardTitle>
                  <CardDescription>Add a dish to a specific category.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMenuItem} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-res">Restaurant</Label>
                      <select 
                        id="item-res"
                        className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        value={newMenuItem.restaurant_id}
                        onChange={(e) => {
                          const rid = e.target.value;
                          setNewMenuItem({...newMenuItem, restaurant_id: rid, category_id: ""});
                        }}
                        required
                      >
                        <option value="">Select Restaurant</option>
                        {restaurants.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-cat">Category</Label>
                      <select 
                        id="item-cat"
                        className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        value={newMenuItem.category_id}
                        onChange={(e) => setNewMenuItem({...newMenuItem, category_id: e.target.value})}
                        required
                        disabled={!newMenuItem.restaurant_id}
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.restaurant_id === newMenuItem.restaurant_id).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-name">Item Name</Label>
                      <Input 
                        id="item-name" 
                        placeholder="e.g. Pepperoni Feast" 
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                        className="rounded-xl h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-price">Price ($)</Label>
                      <Input 
                        id="item-price" 
                        type="number"
                        step="0.01"
                        placeholder="12.99" 
                        value={newMenuItem.price || ""}
                        onChange={(e) => setNewMenuItem({...newMenuItem, price: parseFloat(e.target.value)})}
                        className="rounded-xl h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="item-desc">Description</Label>
                       <Input 
                         id="item-desc" 
                         placeholder="e.g. Tomato sauce, mozzarella..." 
                         value={newMenuItem.description || ""}
                         onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                         className="rounded-xl h-12"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="item-photo">Photo URL</Label>
                       <Input 
                         id="item-photo" 
                         placeholder="https://images..." 
                         value={newMenuItem.image_url || ""}
                         onChange={(e) => setNewMenuItem({...newMenuItem, image_url: e.target.value})}
                         className="rounded-xl h-12"
                       />
                    </div>
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 h-12 rounded-xl font-bold mt-4 text-white">
                      Add Menu Item
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-8">
                 {restaurants.map(res => (
                   <Card key={res.id} className="rounded-3xl border-none shadow-sm overflow-hidden">
                     <div className="p-4 bg-slate-100 flex items-center justify-between">
                       <h4 className="font-bold text-slate-700">{res.name}</h4>
                       <span className="text-xs bg-white px-2 py-1 rounded-lg text-slate-400 font-bold border border-slate-200">
                        {menuItems.filter(m => m.restaurant_id === res.id).length} Items
                       </span>
                     </div>
                     <CardContent className="p-0">
                       <div className="divide-y divide-slate-50">
                          {menuItems.filter(m => m.restaurant_id === res.id).map(item => (
                            <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-400">
                                  {categories.find(c => c.id === item.category_id)?.name || "Uncategorized"}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-black text-emerald-600">${item.price.toFixed(2)}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-slate-200 hover:text-rose-500 rounded-lg"
                                  onClick={() => {
                                    if (confirm("Delete this item?")) {
                                      restaurantService.deleteMenuItem(item.id).then(fetchData);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {menuItems.filter(m => m.restaurant_id === res.id).length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic text-sm">
                              No items added to the menu yet.
                            </div>
                          )}
                       </div>
                     </CardContent>
                   </Card>
                 ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
