import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Phone,
  Book,
  FileText,
  ExternalLink,
  Bird,
  Store,
  CreditCard,
  TruckIcon,
  ShieldCheck,
  Clock,
} from "lucide-react";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const HelpCenterPage = () => {
  const faqs = [
    {
      question: "How do I buy products on C&P?",
      answer:
        "Browse our products, add items to your cart, and proceed to checkout. You can pay securely using our supported payment methods. Make sure you're logged in to complete your purchase.",
    },
    {
      question: "How do I become a seller?",
      answer:
        "Click on 'Become a Seller' in the navigation menu, fill out the registration form with your business details, and submit required documentation. Our team will review your application within 24-48 hours.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept major credit cards, PayPal, and bank transfers. All transactions are processed securely through our payment partners.",
    },
    {
      question: "How is shipping handled?",
      answer:
        "Shipping is handled by our verified sellers using specialized transport for poultry. Delivery times and costs vary by location. Free delivery is available for orders over $100.",
    },
    {
      question: "What if I have issues with my order?",
      answer:
        "Contact the seller directly through our messaging system or reach out to our customer support team. We have a buyer protection policy to ensure your satisfaction.",
    },
  ];

  const resources = [
    {
      title: "Buyer's Guide",
      description: "Learn how to shop safely on our platform",
      icon: Book,
      link: "/guide/buyers",
    },
    {
      title: "Seller Resources",
      description: "Everything you need to start selling",
      icon: Store,
      link: "/guide/sellers",
    },
    {
      title: "Community Forum",
      description: "Connect with other poultry enthusiasts",
      icon: MessageSquare,
      link: "/forum",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers, manage your account, and get support when you need it
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Email Support</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Get help via email, response within 24 hours
                    </p>
                    <a
                      href="mailto:support@candp.com"
                      className="text-sm text-primary hover:underline"
                    >
                      support@candp.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Phone Support</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Available Mon-Fri, 9AM-5PM
                    </p>
                    <a
                      href="tel:+1234567890"
                      className="text-sm text-primary hover:underline"
                    >
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Live Chat</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Chat with our support team
                    </p>
                    <button className="text-sm text-primary hover:underline">
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
              <h2 className="text-xl font-semibold mb-6">Why Trust Us?</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">Verified Sellers</h3>
                    <p className="text-sm text-gray-600">
                      All sellers are vetted and verified
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">Secure Payments</h3>
                    <p className="text-sm text-gray-600">
                      Your transactions are protected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">24/7 Support</h3>
                    <p className="text-sm text-gray-600">
                      Help whenever you need it
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ and Resources Section */}
          <div className="lg:col-span-2">
            {/* FAQ Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-6">
                Frequently Asked Questions
              </h2>
              <div className="divide-y">
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                  />
                ))}
              </div>
            </div>

            {/* Resources Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
              <h2 className="text-xl font-semibold mb-6">Helpful Resources</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <a
                      key={resource.title}
                      href={resource.link}
                      className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-colors group"
                    >
                      <Icon className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-medium text-center group-hover:text-primary">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600 text-center mt-1">
                        {resource.description}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Still Need Help Section */}
            <div className="bg-primary/5 rounded-xl p-6 mt-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    Still need help?
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Our support team is here to help. Contact us through any of
                    the support channels on the left.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
