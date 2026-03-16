"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setFormData({ name: "", email: "", subject: "", message: "" });
            setSubmitted(false);
        }, 3000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
                    <p className="text-gray-600">We&apos;d love to hear from you. Get in touch with us today.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Information */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-orange-600" />
                                    Phone
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-1">Monday to Friday: 9:00 AM - 6:00 PM</p>
                                <p className="text-lg font-bold text-gray-900">+44 (0)191 123 4567</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-orange-600" />
                                    Email
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-1">We&apos;ll reply within 24 hours</p>
                                <p className="text-lg font-bold text-gray-900">support@foodhub.co.uk</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-orange-600" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">123 Main Street</p>
                                <p className="text-gray-600">Newcastle, NE1 1AA</p>
                                <p className="text-lg font-bold text-gray-900 mt-2">United Kingdom</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange-600" />
                                    Business Hours
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>Monday - Friday: 9:00 AM - 9:00 PM</p>
                                    <p>Saturday: 10:00 AM - 10:00 PM</p>
                                    <p>Sunday: 10:00 AM - 8:00 PM</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-orange-600" />
                                Send us a Message
                            </CardTitle>
                            <CardDescription>Fill out the form below and we&apos;ll get back to you as soon as possible</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <Input
                                        type="text"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                    <Input
                                        type="text"
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        placeholder="Your message here..."
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>

                                {submitted && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                                        ✓ Thank you! We&apos;ll get back to you soon.
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-40 mx-auto flex justify-center bg-orange-600 hover:bg-orange-700 cursor-pointer"
                                    disabled={submitted}
                                >
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                q: "How long does delivery take?",
                                a: "Most orders are delivered within 30-45 minutes depending on your location and restaurant.",
                            },
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept all major credit cards, debit cards, and digital payment methods.",
                            },
                            {
                                q: "Can I modify my order after placing it?",
                                a: "You can modify orders within 5 minutes of placing them. Contact support for assistance.",
                            },
                            {
                                q: "Do you offer refunds?",
                                a: "Yes, we offer refunds for cancelled orders or if you're unsatisfied with your meal.",
                            },
                        ].map((faq, idx) => (
                            <Card key={idx}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{faq.q}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">{faq.a}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
