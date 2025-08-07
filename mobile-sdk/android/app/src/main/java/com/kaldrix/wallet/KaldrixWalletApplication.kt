package com.kaldrix.wallet

import android.app.Application
import android.content.Context
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.WorkManager
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.kaldrix.wallet.core.di.AppModule
import com.kaldrix.wallet.core.security.SecurityManager
import com.kaldrix.wallet.core.network.NetworkMonitor
import com.kaldrix.wallet.services.KaldrixFirebaseMessagingService
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltAndroidApp
class KaldrixWalletApplication : Application(), Configuration.Provider {
    
    @Inject
    lateinit var workerFactory: HiltWorkerFactory
    
    @Inject
    lateinit var securityManager: SecurityManager
    
    @Inject
    lateinit var networkMonitor: NetworkMonitor
    
    @Inject
    lateinit var firebaseMessagingService: KaldrixFirebaseMessagingService
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Timber for logging
        initializeTimber()
        
        // Initialize security
        initializeSecurity()
        
        // Initialize network monitoring
        initializeNetworkMonitoring()
        
        // Initialize WorkManager
        initializeWorkManager()
        
        // Initialize Firebase services
        initializeFirebase()
        
        // Initialize crash reporting
        initializeCrashReporting()
        
        Timber.d("KALDRIX Wallet Application initialized")
    }
    
    private fun initializeTimber() {
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(CrashReportingTree())
        }
    }
    
    private fun initializeSecurity() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                securityManager.initialize()
                Timber.d("Security manager initialized")
            } catch (e: Exception) {
                Timber.e(e, "Failed to initialize security manager")
            }
        }
    }
    
    private fun initializeNetworkMonitoring() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                networkMonitor.startMonitoring()
                Timber.d("Network monitoring started")
            } catch (e: Exception) {
                Timber.e(e, "Failed to start network monitoring")
            }
        }
    }
    
    private fun initializeWorkManager() {
        WorkManager.initialize(
            context = this,
            configuration = Configuration.Builder()
                .setWorkerFactory(workerFactory)
                .build()
        )
    }
    
    private fun initializeFirebase() {
        try {
            firebaseMessagingService.initialize()
            Timber.d("Firebase services initialized")
        } catch (e: Exception) {
            Timber.e(e, "Failed to initialize Firebase services")
        }
    }
    
    private fun initializeCrashReporting() {
        if (!BuildConfig.DEBUG) {
            FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(true)
        }
    }
    
    override fun getWorkManagerConfiguration(): Configuration {
        return Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
    }
    
    companion object {
        fun get(context: Context): KaldrixWalletApplication {
            return context.applicationContext as KaldrixWalletApplication
        }
    }
}

// Custom Timber tree for crash reporting
private class CrashReportingTree : Timber.Tree() {
    override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
        if (priority == Log.VERBOSE || priority == Log.DEBUG) {
            return
        }
        
        // Send to Crashlytics
        FirebaseCrashlytics.getInstance().log(message)
        
        if (t != null && priority == Log.ERROR) {
            FirebaseCrashlytics.getInstance().recordException(t)
        }
    }
}