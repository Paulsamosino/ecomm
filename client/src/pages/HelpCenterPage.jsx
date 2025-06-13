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
  Leaf,
  Sun,
  CloudRain,
} from "lucide-react";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#ffecd4] last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-[#cd8539]">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-[#fcba6d]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#fcba6d]" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600 pl-4 border-l-2 border-[#ffecd4] ml-2">
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
    <div className="min-h-screen bg-gradient-to-br from-[#fff5e9] via-[#fffaf2] to-white py-12">
      <div className="container mx-auto px-4">
        {/* Animated background elements */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/farm-pattern.svg')] bg-center opacity-10"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fcba6d]/10 rounded-full blur-[80px] animate-pulse-slow"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e8f4ea]/30 rounded-full blur-[100px] animate-pulse-slow"></div>
        </div>

        {/* Animated icons */}
        <Sun className="absolute top-12 right-[10%] h-16 w-16 text-[#fcba6d] animate-pulse opacity-60" />
        <CloudRain className="absolute top-24 right-[25%] h-8 w-8 text-[#ffd4a3] animate-float opacity-40" />
        <Leaf className="absolute bottom-[20%] left-[10%] h-8 w-8 text-[#8fbc8f]/60 animate-float opacity-40" />

        {/* Header Section */}
        <div className="text-center mb-12 relative">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#fff0dd] text-[#cd8539] text-sm font-medium mb-6 shadow-sm animate-float">
            <Bird className="h-4 w-4 mr-2" />
            <span className="relative">Farm Support Center</span>
          </div>
          <h1 className="text-4xl font-bold text-[#cd8539] mb-4">
            Help Center
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers, manage your account, and get support when you need it
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ffecd4]">
              <h2 className="text-xl font-semibold mb-6 text-[#cd8539] flex items-center">
                <MessageSquare className="h-5 w-5 text-[#fcba6d] mr-2" />
                Contact Support
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#fcba6d] mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-800">Email Support</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Get help via email, response within 24 hours
                    </p>
                    <a
                      href="mailto:support@candp.com"
                      className="text-sm text-[#cd8539] hover:text-[#fcba6d] transition-colors"
                    >
                      support@candp.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#fcba6d] mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-800">Phone Support</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Available Mon-Fri, 9AM-5PM
                    </p>
                    <a
                      href="tel:+1234567890"
                      className="text-sm text-[#cd8539] hover:text-[#fcba6d] transition-colors"
                    >
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-[#fcba6d] mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-800">Live Chat</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      Chat with our support team
                    </p>
                    <button className="text-sm text-[#cd8539] hover:text-[#fcba6d] transition-colors">
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ffecd4] mt-6">
              <h2 className="text-xl font-semibold mb-6 text-[#cd8539] flex items-center">
                <ShieldCheck className="h-5 w-5 text-[#fcba6d] mr-2" />
                Why Trust Us?
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#fff8ef]/50 transition-colors">
                  <ShieldCheck className="h-5 w-5 text-[#fcba6d]" />
                  <div>
                    <h3 className="font-medium text-gray-800">
                      Verified Sellers
                    </h3>
                    <p className="text-sm text-gray-600">
                      All sellers are vetted and verified
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#fff8ef]/50 transition-colors">
                  <CreditCard className="h-5 w-5 text-[#fcba6d]" />
                  <div>
                    <h3 className="font-medium text-gray-800">
                      Secure Payments
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your transactions are protected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#fff8ef]/50 transition-colors">
                  <Clock className="h-5 w-5 text-[#fcba6d]" />
                  <div>
                    <h3 className="font-medium text-gray-800">24/7 Support</h3>
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
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ffecd4]">
              <h2 className="text-xl font-semibold mb-6 text-[#cd8539] flex items-center">
                <HelpCircle className="h-5 w-5 text-[#fcba6d] mr-2" />
                Frequently Asked Questions
              </h2>
              <div className="divide-y divide-[#ffecd4]">
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
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ffecd4] mt-6">
              <h2 className="text-xl font-semibold mb-6 text-[#cd8539] flex items-center">
                <Book className="h-5 w-5 text-[#fcba6d] mr-2" />
                Helpful Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resources.map((resource) => {
                  const Icon = resource.icon;
                  return (
                    <a
                      key={resource.title}
                      href={resource.link}
                      className="flex flex-col items-center p-4 rounded-lg border border-[#ffecd4] hover:border-[#fcba6d] hover:bg-[#fff8ef] transition-colors group shadow-sm"
                    >
                      <Icon className="h-8 w-8 text-[#fcba6d] mb-3" />
                      <h3 className="font-medium text-center group-hover:text-[#cd8539] transition-colors">
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
            <div className="bg-[#fff8ef] rounded-xl p-6 mt-6 border border-[#ffecd4] shadow-sm">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-6 w-6 text-[#fcba6d] mt-1" />
                <div>
                  <h3 className="font-medium text-[#cd8539]">
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
