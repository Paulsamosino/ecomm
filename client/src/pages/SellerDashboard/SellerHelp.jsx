import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  ExternalLink,
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

const SellerHelp = () => {
  const faqs = [
    {
      question: "How do I list a new product?",
      answer:
        "To list a new product, go to the Products page and click the 'Add Product' button. Fill in the required information including title, description, price, and images. Make sure to provide accurate details to help customers make informed decisions.",
    },
    {
      question: "How do I process orders?",
      answer:
        "When you receive a new order, go to the Orders page. You can view order details and update the order status as you process it. Make sure to keep the status updated so customers can track their orders.",
    },
    {
      question: "How do I respond to customer reviews?",
      answer:
        "Navigate to the Reviews page to see all customer reviews. You can respond to reviews by clicking the reply button under each review. Professional and timely responses help build customer trust.",
    },
    {
      question: "How are payments processed?",
      answer:
        "Payments are automatically processed through our secure payment system. The funds will be transferred to your registered bank account according to the payment schedule in your seller agreement.",
    },
    {
      question: "What are the seller fees?",
      answer:
        "We charge a small commission on each sale, which varies by product category. You can view the detailed fee structure in your seller agreement or contact support for more information.",
    },
    {
      question: "How do I handle returns?",
      answer:
        "When a customer initiates a return, you'll receive a notification. Review the return reason and approve or reject it according to your return policy. If approved, provide return shipping instructions to the customer.",
    },
  ];

  const resources = [
    {
      title: "Seller Guidelines",
      description: "Learn about our policies and best practices",
      icon: FileText,
      link: "/seller/guidelines",
    },
    {
      title: "Knowledge Base",
      description: "Find answers to common questions",
      icon: HelpCircle,
      link: "/seller/knowledge-base",
    },
    {
      title: "Community Forum",
      description: "Connect with other sellers",
      icon: MessageSquare,
      link: "/seller/forum",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600">Find answers and get support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Options */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Get help via email, response within 24 hours
                  </p>
                  <a
                    href="mailto:support@example.com"
                    className="text-sm text-primary hover:underline"
                  >
                    support@example.com
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
                    href="tel:1-800-123-4567"
                    className="text-sm text-primary hover:underline"
                  >
                    1-800-123-4567
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

          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-6">Resources</h2>
            <div className="space-y-4">
              {resources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <a
                    key={resource.title}
                    href={resource.link}
                    className="flex items-start gap-3 group"
                  >
                    <Icon className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-medium group-hover:text-primary">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {resource.description}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
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

          <div className="bg-primary/5 rounded-lg p-6 mt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Can't find what you're looking for?
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
  );
};

export default SellerHelp;
