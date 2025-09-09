import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../components/AppIcon';
import DashboardLayout from '../components/dashboard/DashboardLayout';

function ComingSoon() {
  return (
     <DashboardLayout title="Leads & Contacts" currentPath="/contacts">
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        {/* Logo and Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto h-16 w-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg"
        >
          <Icon name="Zap" size={28} color="white" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-4xl font-headline-bold text-foreground"
        >
          LeadForgeAI: Coming Soon
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-base text-muted-foreground font-body"
        >
          Supercharge your lead generation with AI-driven insights. We're crafting something powerful—stay tuned!
        </motion.p>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6"
        >
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 glassmorphism rounded-2xl p-6 shadow-xl text-white font-body-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
           Back To Dashboard
          </a>
        </motion.div>

        {/* Glassmorphism Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="glassmorphism rounded-2xl p-6 shadow-xl"
        >
          <p className="text-sm text-muted-foreground font-body">
            Want to learn more? Follow us on{' '}
            <a
              href="https://x.com/leadforgeai"
              className="text-primary hover:text-primary/80 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>{' '}
            for updates.
          </p>
        </motion.div>
      </motion.div>
    </div>
    </DashboardLayout>
  );
}

export default ComingSoon;