import React from "react";
import {
  HelpCircle,
  Book,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

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

const AdminHelp = () => {
  const faqs = [
    {
      question: "How do I manage user roles?",
      answer:
        "Navigate to the Users Management page, where you can view all users and change their roles using the dropdown menu next to each user. Available roles are Admin, Seller, and Buyer.",
    },
    {
      question: "How do I handle reported content?",
      answer:
        "Go to the Reports Management page to view all reported content and users. You can investigate reports, update their status, and take appropriate action such as removing content or suspending users.",
    },
    {
      question: "How do I review product listings?",
      answer:
        "Use the Listings Management page to view all product listings. You can approve, reject, or suspend listings. Each listing shows details like price, seller information, and report count.",
    },
    {
      question: "How do I view platform analytics?",
      answer:
        "The Analytics page provides comprehensive platform metrics including user growth, revenue, active listings, and more. You can view trends over different time periods and export reports.",
    },
    {
      question: "How do I configure platform settings?",
      answer:
        "Access the Settings page to manage platform-wide configurations like platform fees, notification settings, maintenance mode, and registration controls.",
    },
  ];

  const resources = [
    {
      title: "Admin Guidelines",
      description: "Complete documentation for platform administration",
      icon: Book,
      link: "/admin/docs",
    },
    {
      title: "Knowledge Base",
      description: "Detailed articles and how-to guides",
      icon: FileText,
      link: "/admin/knowledge-base",
    },
    {
      title: "Community Forum",
      description: "Connect with other administrators",
      icon: MessageSquare,
      link: "/admin/forum",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600">
          Get help and learn about platform administration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Options */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Email Support</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Priority support for administrators
                  </p>
                  <a
                    href="mailto:admin-support@example.com"
                    className="text-sm text-primary hover:underline"
                  >
                    admin-support@example.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Phone Support</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Available 24/7 for urgent issues
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
                    Instant support from our team
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
                  Need more detailed help?
                </h3>
                <p className="text-gray-600 mt-1">
                  Check out our comprehensive administrator documentation or
                  contact our support team through any of the channels on the
                  left.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHelp;
