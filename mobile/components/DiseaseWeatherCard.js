import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView as RNScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin, TrendingUp, Droplet, Bug, Wind } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const getRiskColor = (score) => {
  if (score < 25) return ['#10b981', '#34d399'];
  if (score < 50) return ['#eab308', '#facc15'];
  if (score < 75) return ['#f97316', '#fb923c'];
  return ['#ef4444', '#f87171'];
};

const getRiskCategory = (score) => {
  if (score < 25) return 'Low Risk - Safe';
  if (score < 50) return 'Medium Risk';
  if (score < 75) return 'High Risk';
  return 'Critical Risk';
};

export default function DiseaseWeatherCard({ score = 26, location, onMapPress }) {
  // Use fallback if location not provided
  const loc = location || {
    name: 'Gurugram',
    ward: 'Ward 45',
    riskScore: score,
    condition: 'Low Risk - Safe',
    high: Math.round(score * 1.2),
    low: Math.round(score * 0.6),
    aqi: 271,
    aqiStatus: 'Poor',
    forecast: [
      { time: 'Now', temp: score, score: score, condition: '☀️' },
      { time: '2PM', temp: score + 2, score: score + 3, condition: '☀️' },
      { time: '3PM', temp: score + 3, score: score + 5, condition: '⛅' },
      { time: '4PM', temp: score + 1, score: score - 1, condition: '⛅' },
      { time: '5PM', temp: score - 1, score: score - 3, condition: '☀️' },
      { time: '6PM', temp: score - 3, score: score - 5, condition: '☀️' },
    ],
  };

  const riskGradient = getRiskColor(score);
  const categoryLabel = getRiskCategory(score);

  return (
    <View style={styles.wrapper}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MapPin size={20} color="#10b981" />
          <Text style={styles.headerText}>My Location</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell size={20} color="#10b981" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Main Weather-style Card */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.1)', 'rgba(52, 211, 153, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mainCard}
      >
        {/* Location Name */}
        <Text style={styles.location}>{loc.name}</Text>

        {/* Risk Score - Large Display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{Math.round(score)}</Text>
          <View style={styles.scoreSubtext}>
            <Text style={styles.scoreLabel}>Risk Score</Text>
          </View>
        </View>

        {/* Category & Condition */}
        <Text style={styles.condition}>{categoryLabel}</Text>

        {/* High/Low Display */}
        <View style={styles.tempRange}>
          <View style={styles.tempItem}>
            <Text style={styles.tempLabel}>High</Text>
            <Text style={styles.tempValue}>{loc.high}°</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.tempItem}>
            <Text style={styles.tempLabel}>Low</Text>
            <Text style={styles.tempValue}>{loc.low}°</Text>
          </View>
        </View>
      </LinearGradient>

      {/* AQI / Risk Index Card */}
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.1)', 'rgba(96, 165, 250, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aqiCard}
      >
        <View style={styles.aqiHeader}>
          <Text style={styles.aqiTitle}>{loc.aqi} - {loc.aqiStatus}</Text>
        </View>

        {/* AQI Gradient Bar */}
        <View style={styles.gradientBar}>
          <LinearGradient
            colors={['#10b981', '#eab308', '#f97316', '#ef4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBarFill}
          >
            {/* Indicator */}
            <View
              style={[
                styles.aqiIndicator,
                { left: `${Math.min((loc.aqi / 500) * 100, 100)}%` },
              ]}
            />
          </LinearGradient>
        </View>

        {/* AQI Description */}
        <Text style={styles.aqiDescription}>
          Health risk index is {loc.aqi}, which{' '}
          {loc.aqi > 200 ? 'requires immediate precautions' : 'is similar to yesterday at about this time'}.
        </Text>

        {/* Risk Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Droplet size={20} color="#06b6d4" />
            <Text style={styles.metricLabel}>Water</Text>
            <Text style={styles.metricValue}>Safe</Text>
          </View>
          <View style={styles.metricItem}>
            <Bug size={20} color="#f59e0b" />
            <Text style={styles.metricLabel}>Vector</Text>
            <Text style={styles.metricValue}>Low</Text>
          </View>
          <View style={styles.metricItem}>
            <Wind size={20} color="#8b5cf6" />
            <Text style={styles.metricLabel}>Air</Text>
            <Text style={styles.metricValue}>Poor</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Hourly Forecast */}
      <View style={styles.forecastSection}>
        <View style={styles.forecastHeader}>
          <TrendingUp size={18} color="#60a5fa" />
          <Text style={styles.forecastTitle}>HOURLY FORECAST</Text>
        </View>

        <RNScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.forecastScroll}
          contentContainerStyle={styles.forecastContent}
        >
          {loc.forecast && loc.forecast.map((item, idx) => (
            <View key={idx} style={styles.forecastItem}>
              <Text style={styles.forecastTime}>{item.time}</Text>
              <Text style={styles.forecastEmoji}>{item.condition}</Text>
              <Text style={styles.forecastScore}>{item.score}°</Text>
            </View>
          ))}
        </RNScrollView>
      </View>

      {/* Disease Risk Map Button */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={onMapPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapButtonGradient}
        >
          <MapPin size={20} color="#fff" />
          <Text style={styles.mapButtonText}>View Disease Risk Map</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Alert Banner */}
      {score > 50 && (
        <View style={[styles.alertBanner, { backgroundColor: riskGradient[0] + '20' }]}>
          <Text style={[styles.alertText, { color: riskGradient[0] }]}>
            ⚠️ Health alert for your area. Check precautions in the tips section.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationBtn: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  mainCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  location: {
    fontSize: 18,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    letterSpacing: 1,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#10b981',
    lineHeight: 140,
  },
  scoreSubtext: {
    marginTop: 8,
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  condition: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 24,
  },
  tempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    width: '100%',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  tempItem: {
    alignItems: 'center',
    flex: 1,
  },
  tempLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tempValue: {
    color: '#e2e8f0',
    fontSize: 24,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },

  aqiCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  aqiHeader: {
    marginBottom: 16,
  },
  aqiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  gradientBar: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradientBarFill: {
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  aqiIndicator: {
    position: 'absolute',
    width: 4,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  aqiDescription: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  forecastSection: {
    marginBottom: 24,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  forecastTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  forecastScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  forecastContent: {
    gap: 12,
  },
  forecastItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  forecastTime: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  forecastEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  forecastScore: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '700',
  },

  mapButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  alertBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  alertText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
